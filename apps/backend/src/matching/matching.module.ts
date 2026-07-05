import { Module } from "@nestjs/common";
import { MatchingService } from "./matching.service";
import { RealtimeModule } from "../realtime/realtime.module";

@Module({
  imports: [RealtimeModule],
  providers: [MatchingService],
  exports: [MatchingService],
})
export class MatchingModule {}
