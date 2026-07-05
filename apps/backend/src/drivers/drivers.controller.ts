import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/jwt-payload.interface";
import { DriversService } from "./drivers.service";
import { RegisterDriverDto } from "./dto/register-driver.dto";
import { UpdateDriverStatusDto } from "./dto/update-driver-status.dto";

@UseGuards(JwtAuthGuard)
@Controller("drivers")
export class DriversController {
  constructor(private readonly driversService: DriversService) {}

  @Post("documents")
  registerDriver(@CurrentUser() user: JwtPayload, @Body() dto: RegisterDriverDto) {
    return this.driversService.registerDriver(user.sub, dto);
  }

  @Patch("status")
  updateStatus(@CurrentUser() user: JwtPayload, @Body() dto: UpdateDriverStatusDto) {
    const location = dto.lat != null && dto.lng != null ? { lat: dto.lat, lng: dto.lng } : undefined;
    return this.driversService.updateStatus(user.sub, dto, location);
  }

  @Get("me/earnings")
  getEarnings(@CurrentUser() user: JwtPayload) {
    return this.driversService.getEarnings(user.sub);
  }
}
