import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/jwt-payload.interface";
import { VehiclesService } from "./vehicles.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";

@UseGuards(JwtAuthGuard)
@Controller("vehicles")
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(user.sub, dto);
  }

  @Get("me")
  findMine(@CurrentUser() user: JwtPayload) {
    return this.vehiclesService.findMine(user.sub);
  }
}
