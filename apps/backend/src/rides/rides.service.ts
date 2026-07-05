import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../prisma/prisma.service";
import { GeoService } from "../geo/geo.service";
import { MatchingService } from "../matching/matching.service";
import { RealtimeGateway } from "../realtime/realtime.gateway";
import { EstimateRideDto } from "./dto/estimate-ride.dto";
import { CreateRideDto } from "./dto/create-ride.dto";
import type { RideStatus } from "@prisma/client";

@Injectable()
export class RidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly geoService: GeoService,
    private readonly matchingService: MatchingService,
    private readonly realtimeGateway: RealtimeGateway,
    private readonly config: ConfigService,
  ) {}

  async estimate(dto: EstimateRideDto) {
    const directions = await this.geoService.directions(dto.origin.toGeoPoint(), dto.destination.toGeoPoint());
    const estimatedFare = this.calculateFare(directions.distanceKm, directions.durationMin);
    return { ...directions, estimatedFare };
  }

  async create(passengerId: string, dto: CreateRideDto) {
    const directions = await this.geoService.directions(dto.origin.toGeoPoint(), dto.destination.toGeoPoint());
    const estimatedFare = this.calculateFare(directions.distanceKm, directions.durationMin);

    const ride = await this.prisma.ride.create({
      data: {
        passengerId,
        status: "SEARCHING",
        originLat: directions.origin.lat,
        originLng: directions.origin.lng,
        originAddress: directions.origin.address,
        destinationLat: directions.destination.lat,
        destinationLng: directions.destination.lng,
        destinationAddress: directions.destination.address,
        distanceKm: directions.distanceKm,
        durationMin: directions.durationMin,
        estimatedFare,
        routePolyline: directions.routePolyline,
        paymentMethod: "PIX",
      },
    });

    this.matchingService.matchRide(ride).then(async (result) => {
      if (!result.matched) {
        const current = await this.prisma.ride.findUnique({ where: { id: ride.id } });
        if (current?.status === "SEARCHING") {
          await this.prisma.ride.update({
            where: { id: ride.id },
            data: { status: "CANCELLED", cancelledAt: new Date() },
          });
          this.realtimeGateway.emitRideStatus(ride.id, "CANCELLED");
        }
      }
    });

    return ride;
  }

  async findById(rideId: string, userId: string) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundException("Corrida não encontrada");
    if (ride.passengerId !== userId && ride.driverId !== userId) {
      throw new ForbiddenException("Você não participa desta corrida");
    }
    return ride;
  }

  history(userId: string) {
    return this.prisma.ride.findMany({
      where: { OR: [{ passengerId: userId }, { driverId: userId }] },
      orderBy: { requestedAt: "desc" },
    });
  }

  async accept(rideId: string, driverId: string) {
    const result = await this.prisma.ride.updateMany({
      where: { id: rideId, status: "SEARCHING", driverId: null },
      data: { driverId, status: "ACCEPTED", acceptedAt: new Date() },
    });
    if (result.count === 0) {
      throw new BadRequestException("Corrida indisponível para aceite");
    }
    this.realtimeGateway.emitRideStatus(rideId, "ACCEPTED", driverId);
    return this.prisma.ride.findUnique({ where: { id: rideId } });
  }

  async markArrived(rideId: string, driverId: string) {
    return this.transition(rideId, driverId, "ACCEPTED", "ARRIVED", {});
  }

  async start(rideId: string, driverId: string) {
    return this.transition(rideId, driverId, "ARRIVED", "IN_PROGRESS", { startedAt: new Date() });
  }

  async complete(rideId: string, driverId: string) {
    const ride = await this.transition(rideId, driverId, "IN_PROGRESS", "COMPLETED", {
      completedAt: new Date(),
    });

    const finalFare = ride.estimatedFare ?? 0;
    const updated = await this.prisma.ride.update({
      where: { id: rideId },
      data: {
        finalFare,
        payment: {
          create: { amount: finalFare, method: ride.paymentMethod, status: "PENDING" },
        },
      },
    });
    return updated;
  }

  async cancel(rideId: string, userId: string) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundException("Corrida não encontrada");
    if (ride.passengerId !== userId && ride.driverId !== userId) {
      throw new ForbiddenException("Você não participa desta corrida");
    }
    if (["COMPLETED", "CANCELLED"].includes(ride.status)) {
      throw new BadRequestException("Corrida já finalizada");
    }

    const updated = await this.prisma.ride.update({
      where: { id: rideId },
      data: { status: "CANCELLED", cancelledAt: new Date() },
    });
    this.realtimeGateway.emitRideStatus(rideId, "CANCELLED", ride.driverId);
    return updated;
  }

  private async transition(
    rideId: string,
    driverId: string,
    fromStatus: RideStatus,
    toStatus: RideStatus,
    extraData: Record<string, unknown>,
  ) {
    const result = await this.prisma.ride.updateMany({
      where: { id: rideId, driverId, status: fromStatus },
      data: { status: toStatus, ...extraData },
    });
    if (result.count === 0) {
      throw new BadRequestException(`Não foi possível mudar a corrida para ${toStatus}`);
    }
    this.realtimeGateway.emitRideStatus(rideId, toStatus, driverId);
    return this.prisma.ride.findUniqueOrThrow({ where: { id: rideId } });
  }

  private calculateFare(distanceKm: number, durationMin: number): number {
    const baseFare = this.config.get<number>("ride.baseFare") ?? 4.5;
    const perKm = this.config.get<number>("ride.perKm") ?? 1.75;
    const perMin = this.config.get<number>("ride.perMin") ?? 0.35;
    const fare = baseFare + perKm * distanceKm + perMin * durationMin;
    return Math.round(fare * 100) / 100;
  }
}
