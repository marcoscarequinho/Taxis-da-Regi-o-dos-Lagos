import { Inject, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type Redis from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.module";
import { PrismaService } from "../prisma/prisma.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { ONLINE_DRIVERS_GEO_KEY } from "./matching.constants";
import type { Ride } from "@prisma/client";

interface NearbyDriver {
  driverId: string;
  distanceKm: number;
}

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly config: ConfigService,
  ) {}

  async findNearbyDrivers(lat: number, lng: number, radiusKm: number): Promise<NearbyDriver[]> {
    const results = (await this.redis.geosearch(
      ONLINE_DRIVERS_GEO_KEY,
      "FROMLONLAT",
      lng,
      lat,
      "BYRADIUS",
      radiusKm,
      "km",
      "ASC",
      "WITHCOORD",
      "WITHDIST",
    )) as unknown as [string, string, [string, string]][];

    return results.map(([driverId, distance]) => ({
      driverId,
      distanceKm: parseFloat(distance),
    }));
  }

  /** Tries to match a ride to the nearest available driver, offering sequentially. */
  async matchRide(ride: Ride): Promise<{ matched: boolean; driverId?: string }> {
    const radiusKm = this.config.get<number>("ride.matchRadiusKm") ?? 3;
    const offerTimeoutSec = this.config.get<number>("ride.matchOfferTimeoutSec") ?? 15;

    const candidates = await this.findNearbyDrivers(ride.originLat, ride.originLng, radiusKm);

    const passenger = await this.prisma.user.findUnique({ where: { id: ride.passengerId } });

    for (const candidate of candidates) {
      const currentRide = await this.prisma.ride.findUnique({ where: { id: ride.id } });
      if (!currentRide || currentRide.status !== "SEARCHING") {
        return { matched: currentRide?.status === "ACCEPTED", driverId: currentRide?.driverId ?? undefined };
      }

      const alreadyBusy = await this.prisma.ride.findFirst({
        where: { driverId: candidate.driverId, status: { in: ["ACCEPTED", "ARRIVED", "IN_PROGRESS"] } },
      });
      if (alreadyBusy) continue;

      const accepted = await this.realtimeGateway.sendRideOffer(
        candidate.driverId,
        {
          rideId: ride.id,
          passengerName: passenger?.name ?? "Passageiro",
          origin: { lat: ride.originLat, lng: ride.originLng, address: ride.originAddress },
          destination: { lat: ride.destinationLat, lng: ride.destinationLng, address: ride.destinationAddress },
          estimatedFare: ride.estimatedFare ?? 0,
          distanceKm: ride.distanceKm ?? 0,
          offerExpiresAt: new Date(Date.now() + offerTimeoutSec * 1000).toISOString(),
        },
        offerTimeoutSec * 1000,
      );

      if (accepted) {
        const updated = await this.prisma.ride.updateMany({
          where: { id: ride.id, status: "SEARCHING" },
          data: { driverId: candidate.driverId, status: "ACCEPTED", acceptedAt: new Date() },
        });
        if (updated.count > 0) {
          this.realtimeGateway.emitRideStatus(ride.id, "ACCEPTED", candidate.driverId);
          return { matched: true, driverId: candidate.driverId };
        }
      }
    }

    this.logger.log(`Nenhum motorista aceitou a corrida ${ride.id}`);
    return { matched: false };
  }
}
