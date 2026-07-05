import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/jwt-payload.interface";
import { RatingsService } from "./ratings.service";
import { CreateRatingDto } from "./dto/create-rating.dto";

@UseGuards(JwtAuthGuard)
@Controller("rides/:id/rating")
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Param("id") rideId: string, @Body() dto: CreateRatingDto) {
    return this.ratingsService.create(rideId, user.sub, dto);
  }
}
