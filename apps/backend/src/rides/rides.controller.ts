import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/jwt-payload.interface";
import { RidesService } from "./rides.service";
import { EstimateRideDto } from "./dto/estimate-ride.dto";
import { CreateRideDto } from "./dto/create-ride.dto";

@UseGuards(JwtAuthGuard)
@Controller("rides")
export class RidesController {
  constructor(private readonly ridesService: RidesService) {}

  @Post("estimate")
  estimate(@Body() dto: EstimateRideDto) {
    return this.ridesService.estimate(dto);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateRideDto) {
    return this.ridesService.create(user.sub, dto);
  }

  @Get("history")
  history(@CurrentUser() user: JwtPayload) {
    return this.ridesService.history(user.sub);
  }

  @Get(":id")
  findById(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.ridesService.findById(id, user.sub);
  }

  @Patch(":id/accept")
  accept(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.ridesService.accept(id, user.sub);
  }

  @Patch(":id/arrived")
  arrived(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.ridesService.markArrived(id, user.sub);
  }

  @Patch(":id/start")
  start(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.ridesService.start(id, user.sub);
  }

  @Patch(":id/complete")
  complete(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.ridesService.complete(id, user.sub);
  }

  @Patch(":id/cancel")
  cancel(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.ridesService.cancel(id, user.sub);
  }
}
