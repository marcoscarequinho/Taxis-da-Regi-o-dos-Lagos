import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { PaginationDto } from "../common/dto/pagination.dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(pagination: PaginationDto) {
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          isDriver: true,
          isPassenger: true,
          avatarUrl: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.user.count(),
    ]);

    return { items, total, page: pagination.page ?? 1, pageSize: pagination.take };
  }

  async listRides(pagination: PaginationDto) {
    const [items, total] = await Promise.all([
      this.prisma.ride.findMany({
        include: {
          passenger: { select: { name: true, email: true } },
          driver: { select: { name: true, email: true } },
          payment: true,
        },
        orderBy: { requestedAt: "desc" },
        skip: pagination.skip,
        take: pagination.take,
      }),
      this.prisma.ride.count(),
    ]);

    return { items, total, page: pagination.page ?? 1, pageSize: pagination.take };
  }
}
