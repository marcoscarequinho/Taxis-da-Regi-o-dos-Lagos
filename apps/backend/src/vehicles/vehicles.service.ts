import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(driverId: string, dto: CreateVehicleDto) {
    const driverProfile = await this.prisma.driverProfile.findUnique({ where: { userId: driverId } });
    if (!driverProfile) {
      throw new NotFoundException("Cadastre-se como motorista antes de adicionar um veículo");
    }

    const existingPlate = await this.prisma.vehicle.findUnique({ where: { plate: dto.plate } });
    if (existingPlate) {
      throw new ConflictException("Placa já cadastrada");
    }

    return this.prisma.vehicle.create({ data: { ...dto, driverId } });
  }

  findMine(driverId: string) {
    return this.prisma.vehicle.findMany({ where: { driverId } });
  }
}
