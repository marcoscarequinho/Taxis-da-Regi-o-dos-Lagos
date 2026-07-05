import { Module } from "@nestjs/common";
import { HttpModule } from "@nestjs/axios";
import { GeoService } from "./geo.service";
import { GeoController } from "./geo.controller";
import { AuthModule } from "../auth/auth.module";

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [GeoController],
  providers: [GeoService],
  exports: [GeoService],
})
export class GeoModule {}
