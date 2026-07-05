import { Controller, Get, Query, Res, UseGuards } from "@nestjs/common";
import type { Response } from "express";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/jwt-payload.interface";
import { MercadoPagoConnectService } from "./mercadopago-connect.service";

@Controller("drivers/mercadopago")
export class MercadoPagoConnectController {
  constructor(private readonly connectService: MercadoPagoConnectService) {}

  @UseGuards(JwtAuthGuard)
  @Get("connect-url")
  getConnectUrl(@CurrentUser() user: JwtPayload) {
    return { url: this.connectService.getAuthorizationUrl(user.sub) };
  }

  /** Public: Mercado Pago redirects the driver's browser here after authorization. */
  @Get("callback")
  async callback(@Query("code") code: string, @Query("state") state: string, @Res() res: Response) {
    try {
      await this.connectService.handleCallback(code, state);
      res.status(200).send(
        "<html><body style=\"font-family:sans-serif;text-align:center;padding-top:60px\">" +
          "<h2>Conta Mercado Pago conectada!</h2><p>Você já pode voltar para o aplicativo.</p></body></html>",
      );
    } catch {
      res.status(400).send(
        "<html><body style=\"font-family:sans-serif;text-align:center;padding-top:60px\">" +
          "<h2>Não foi possível conectar sua conta</h2><p>Volte ao aplicativo e tente novamente.</p></body></html>",
      );
    }
  }
}
