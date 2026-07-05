import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { JwtPayload } from "../jwt-payload.interface";

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: JwtPayload }>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException("Token de acesso ausente");
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: this.config.get<string>("jwt.accessSecret"),
      });
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException("Token de acesso inválido ou expirado");
    }
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" ? token : undefined;
  }
}
