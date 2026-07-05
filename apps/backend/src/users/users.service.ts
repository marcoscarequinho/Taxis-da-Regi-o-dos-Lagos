import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { SwitchModeDto } from "./dto/switch-mode.dto";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { driverProfile: { include: { vehicles: true } } },
    });
    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }
    return this.toSummary(user);
  }

  async update(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      include: { driverProfile: { include: { vehicles: true } } },
    });
    return this.toSummary(user);
  }

  private sanitizeDriverProfile(driverProfile: any) {
    if (!driverProfile) return null;
    const { mpAccessToken, mpRefreshToken, ...safe } = driverProfile;
    return { ...safe, mpConnected: Boolean(driverProfile.mpUserId) };
  }

  async switchMode(userId: string, dto: SwitchModeDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { driverProfile: true },
    });
    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    if (dto.mode === "driver" && !user.isDriver) {
      throw new ForbiddenException(
        "Complete o cadastro de motorista (CNH, veículo) antes de entrar no modo motorista",
      );
    }

    return { mode: dto.mode, ok: true };
  }

  private toSummary(user: any) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      isDriver: user.isDriver,
      isPassenger: user.isPassenger,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      driverProfile: this.sanitizeDriverProfile(user.driverProfile),
    };
  }
}
