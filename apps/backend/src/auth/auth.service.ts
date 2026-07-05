import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtPayload } from "./jwt-payload.interface";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { phone: dto.phone }] },
    });
    if (existing) {
      throw new ConflictException("E-mail ou telefone já cadastrado");
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        isDriver: dto.isDriver ?? false,
        isPassenger: true,
      },
    });

    return this.buildAuthResponse(user.id, user.email, user.isAdmin);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Credenciais inválidas");
    }

    return this.buildAuthResponse(user.id, user.email, user.isAdmin);
  }

  async refresh(refreshToken: string) {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: this.config.get<string>("jwt.refreshSecret"),
      });
    } catch {
      throw new UnauthorizedException("Refresh token inválido ou expirado");
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException("Usuário não encontrado");
    }

    return this.buildAuthResponse(user.id, user.email, user.isAdmin);
  }

  private async buildAuthResponse(userId: string, email: string, isAdmin: boolean) {
    const payload: JwtPayload = { sub: userId, email, isAdmin };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>("jwt.accessSecret"),
        expiresIn: this.config.get<string>("jwt.accessExpiresIn"),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>("jwt.refreshSecret"),
        expiresIn: this.config.get<string>("jwt.refreshExpiresIn"),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
