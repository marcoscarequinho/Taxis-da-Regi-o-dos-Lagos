import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateRatingDto } from "./dto/create-rating.dto";

@Injectable()
export class RatingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(rideId: string, fromUserId: string, dto: CreateRatingDto) {
    const ride = await this.prisma.ride.findUnique({ where: { id: rideId } });
    if (!ride) throw new NotFoundException("Corrida não encontrada");
    if (ride.status !== "COMPLETED") {
      throw new BadRequestException("Só é possível avaliar corridas concluídas");
    }

    let toUserId: string;
    if (ride.passengerId === fromUserId) {
      if (!ride.driverId) throw new BadRequestException("Corrida sem motorista associado");
      toUserId = ride.driverId;
    } else if (ride.driverId === fromUserId) {
      toUserId = ride.passengerId;
    } else {
      throw new ForbiddenException("Você não participou desta corrida");
    }

    const existing = await this.prisma.rating.findFirst({ where: { rideId, fromUserId } });
    if (existing) {
      throw new ConflictException("Você já avaliou esta corrida");
    }

    const rating = await this.prisma.rating.create({
      data: { rideId, fromUserId, toUserId, score: dto.score, comment: dto.comment },
    });

    const toUserDriverProfile = await this.prisma.driverProfile.findUnique({ where: { userId: toUserId } });
    if (toUserDriverProfile) {
      const agg = await this.prisma.rating.aggregate({
        where: { toUserId },
        _avg: { score: true },
      });
      await this.prisma.driverProfile.update({
        where: { userId: toUserId },
        data: { ratingAvg: agg._avg.score ?? 5 },
      });
    }

    return rating;
  }
}
