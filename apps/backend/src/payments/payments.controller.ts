import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/jwt-payload.interface";
import { PaymentsService } from "./payments.service";
import { PayRideDto } from "./dto/pay-ride.dto";

@Controller("payments")
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post("rides/:id/pay")
  pay(@CurrentUser() user: JwtPayload, @Param("id") rideId: string, @Body() dto: PayRideDto) {
    return this.paymentsService.pay(rideId, user.sub, dto);
  }

  @Post("webhook/mercadopago")
  webhook(@Body() body: { data?: { id?: string } }) {
    return this.paymentsService.handleWebhook(body);
  }
}
