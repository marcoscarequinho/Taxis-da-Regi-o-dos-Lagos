import { Module } from "@nestjs/common";
import { RidesService } from "./rides.service";
import { RidesController } from "./rides.controller";
import { AuthModule } from "../auth/auth.module";
import { GeoModule } from "../geo/geo.module";
import { MatchingModule } from "../matching/matching.module";
import { RealtimeModule } from "../realtime/realtime.module";

@Module({
  imports: [AuthModule, GeoModule, MatchingModule, RealtimeModule],
  controllers: [RidesController],
  providers: [RidesService],
  exports: [RidesService],
})
export class RidesModule {}
