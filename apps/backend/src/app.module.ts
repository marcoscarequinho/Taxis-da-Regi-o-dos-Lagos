import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { AppController } from "./app.controller";
import configuration from "./config/configuration";
import { PrismaModule } from "./prisma/prisma.module";
import { RedisModule } from "./redis/redis.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { DriversModule } from "./drivers/drivers.module";
import { VehiclesModule } from "./vehicles/vehicles.module";
import { GeoModule } from "./geo/geo.module";
import { RealtimeModule } from "./realtime/realtime.module";
import { MatchingModule } from "./matching/matching.module";
import { RidesModule } from "./rides/rides.module";
import { PaymentsModule } from "./payments/payments.module";
import { RatingsModule } from "./ratings/ratings.module";
import { AdminModule } from "./admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    RedisModule,
    AuthModule,
    UsersModule,
    DriversModule,
    VehiclesModule,
    GeoModule,
    RealtimeModule,
    MatchingModule,
    RidesModule,
    PaymentsModule,
    RatingsModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
