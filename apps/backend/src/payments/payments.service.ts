import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MercadoPagoConfig, Payment as MercadoPagoPayment } from "mercadopago";
import { PrismaService } from "../prisma/prisma.service";
import { PayRideDto } from "./dto/pay-ride.dto";
import type { PaymentStatus } from "@prisma/client";

@Injectable()
export class PaymentsService {
  private readonly mpClient: MercadoPagoConfig;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.mpClient = new MercadoPagoConfig({
      accessToken: this.config.get<string>("mercadoPago.accessToken") ?? "",
    });
  }

  async pay(rideId: string, userId: string, dto: PayRideDto) {
    const ride = await this.prisma.ride.findUnique({
      where: { id: rideId },
      include: { payment: true, driver: { include: { driverProfile: true } } },
    });
    if (!ride) throw new NotFoundException("Corrida não encontrada");
    if (ride.passengerId !== userId) {
      throw new BadRequestException("Apenas o passageiro pode pagar a corrida");
    }
    if (!ride.payment) {
      throw new BadRequestException("Corrida ainda não possui cobrança gerada (conclua a corrida primeiro)");
    }
    if (ride.payment.status === "PAID") {
      return ride.payment;
    }

    const driverMpUserId = ride.driver?.driverProfile?.mpUserId;
    if (!driverMpUserId) {
      throw new BadRequestException(
        "O motorista ainda não conectou uma conta Mercado Pago para receber o repasse via Pix",
      );
    }

    const driverShare = this.config.get<number>("ride.driverShare") ?? 0.8;
    const totalAmount = ride.payment.amount;
    const driverAmount = Math.round(totalAmount * driverShare * 100) / 100;

    const paymentClient = new MercadoPagoPayment(this.mpClient);
    const result = await paymentClient.create({
      body: {
        transaction_amount: totalAmount,
        description: `Corrida ${ride.id}`,
        payment_method_id: "pix",
        payer: { email: dto.payerEmail },
        disbursements: [
          {
            amount: driverAmount,
            collector_id: Number(driverMpUserId),
            external_reference: ride.id,
          },
        ],
      } as any,
    });

    const status = this.mapStatus(result.status);
    const updatedPayment = await this.prisma.payment.update({
      where: { id: ride.payment.id },
      data: {
        status,
        providerTransactionId: result.id ? String(result.id) : undefined,
        paidAt: status === "PAID" ? new Date() : null,
      },
    });

    const pixData = result.point_of_interaction?.transaction_data;
    return {
      ...updatedPayment,
      driverAmount,
      platformAmount: Math.round((totalAmount - driverAmount) * 100) / 100,
      pix: { qrCode: pixData?.qr_code, qrCodeBase64: pixData?.qr_code_base64 },
    };
  }

  async handleWebhook(payload: { data?: { id?: string } }) {
    const paymentId = payload?.data?.id;
    if (!paymentId) return;

    const paymentClient = new MercadoPagoPayment(this.mpClient);
    const result = await paymentClient.get({ id: paymentId });
    const status = this.mapStatus(result.status);

    await this.prisma.payment.updateMany({
      where: { providerTransactionId: String(paymentId) },
      data: { status, paidAt: status === "PAID" ? new Date() : null },
    });
  }

  private mapStatus(mpStatus?: string): PaymentStatus {
    switch (mpStatus) {
      case "approved":
        return "PAID";
      case "rejected":
        return "FAILED";
      case "refunded":
      case "charged_back":
        return "REFUNDED";
      default:
        return "PENDING";
    }
  }
}
