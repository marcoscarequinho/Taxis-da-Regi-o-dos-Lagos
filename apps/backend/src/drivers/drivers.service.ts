import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type Redis from "ioredis";
import { PrismaService } from "../prisma/prisma.service";
import { REDIS_CLIENT } from "../redis/redis.module";
import { ONLINE_DRIVERS_GEO_KEY } from "../matching/matching.constants";
import { RegisterDriverDto } from "./dto/register-driver.dto";
import { UpdateDriverStatusDto } from "./dto/update-driver-status.dto";

@Injectable()
export class DriversService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async registerDriver(userId: string, dto: RegisterDriverDto) {
    const existing = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (existing) {
      throw new ConflictException("Perfil de motorista já cadastrado");
    }

    const [driverProfile] = await this.prisma.$transaction([
      this.prisma.driverProfile.create({
        data: {
          userId,
          cnhNumber: dto.cnhNumber,
          cnhDocUrl: dto.cnhDocUrl,
        },
      }),
      this.prisma.user.update({ where: { id: userId }, data: { isDriver: true } }),
    ]);

    return driverProfile;
  }

  async updateStatus(userId: string, dto: UpdateDriverStatusDto, location?: { lat: number; lng: number }) {
    const profile = await this.prisma.driverProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException("Cadastro de motorista não encontrado");
    }

    await this.prisma.driverProfile.update({ where: { userId }, data: { isOnline: dto.isOnline } });

    if (dto.isOnline && location) {
      await this.redis.geoadd(ONLINE_DRIVERS_GEO_KEY, location.lng, location.lat, userId);
    } else {
      await this.redis.zrem(ONLINE_DRIVERS_GEO_KEY, userId);
    }

    return { isOnline: dto.isOnline };
  }

  async getEarnings(userId: string) {
    const rides = await this.prisma.ride.findMany({
      where: { driverId: userId, status: "COMPLETED" },
      include: { payment: true },
      orderBy: { completedAt: "desc" },
    });

    const commissionRate = this.config.get<number>("ride.commissionRate") ?? 0.2;

    const items = rides.map((ride) => {
      const gross = ride.finalFare ?? 0;
      const commission = gross * commissionRate;
      return {
        rideId: ride.id,
        completedAt: ride.completedAt,
        gross,
        commission,
        net: gross - commission,
        paymentStatus: ride.payment?.status ?? "PENDING",
      };
    });

    const totals = items.reduce(
      (acc, item) => ({
        gross: acc.gross + item.gross,
        commission: acc.commission + item.commission,
        net: acc.net + item.net,
      }),
      { gross: 0, commission: 0, net: 0 },
    );

    return { totals, rides: items };
  }
}
