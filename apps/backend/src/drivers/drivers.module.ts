import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { DriversService } from "./drivers.service";
import { DriversController } from "./drivers.controller";
import { MercadoPagoConnectService } from "./mercadopago-connect.service";
import { MercadoPagoConnectController } from "./mercadopago-connect.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [AuthModule, HttpModule],
  controllers: [DriversController, MercadoPagoConnectController],
  providers: [DriversService, MercadoPagoConnectService],
  exports: [DriversService],
})
export class DriversModule {}
