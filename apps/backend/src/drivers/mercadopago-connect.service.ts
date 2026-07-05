import { BadGatewayException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MercadoPagoConnectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  getAuthorizationUrl(driverUserId: string): string {
    const clientId = this.config.get<string>("mercadoPago.clientId");
    const redirectUri = this.config.get<string>("mercadoPago.oauthRedirectUri");

    const url = new URL("https://auth.mercadopago.com.br/authorization");
    url.searchParams.set("client_id", clientId ?? "");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("platform_id", "mp");
    url.searchParams.set("redirect_uri", redirectUri ?? "");
    // `state` carries the driver's userId so the callback knows whose profile to update.
    url.searchParams.set("state", driverUserId);
    return url.toString();
  }

  async handleCallback(code: string, driverUserId: string) {
    const driverProfile = await this.prisma.driverProfile.findUnique({ where: { userId: driverUserId } });
    if (!driverProfile) {
      throw new NotFoundException("Cadastro de motorista não encontrado");
    }

    try {
      const { data } = await firstValueFrom(
        this.http.post("https://api.mercadopago.com/oauth/token", {
          client_id: this.config.get<string>("mercadoPago.clientId"),
          client_secret: this.config.get<string>("mercadoPago.clientSecret"),
          grant_type: "authorization_code",
          code,
          redirect_uri: this.config.get<string>("mercadoPago.oauthRedirectUri"),
        }),
      );

      await this.prisma.driverProfile.update({
        where: { userId: driverUserId },
        data: {
          mpUserId: String(data.user_id),
          mpAccessToken: data.access_token,
          mpRefreshToken: data.refresh_token,
          mpConnectedAt: new Date(),
        },
      });
    } catch (error) {
      throw new BadGatewayException("Falha ao conectar conta Mercado Pago");
    }
  }
}
