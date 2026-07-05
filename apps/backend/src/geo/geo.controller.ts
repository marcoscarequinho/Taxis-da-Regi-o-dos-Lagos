import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { GeoService } from "./geo.service";
import { DirectionsDto } from "./dto/directions.dto";

@UseGuards(JwtAuthGuard)
@Controller("geo")
export class GeoController {
  constructor(private readonly geoService: GeoService) {}

  @Get("autocomplete")
  autocomplete(@Query("input") input: string, @Query("sessionToken") sessionToken?: string) {
    return this.geoService.autocomplete(input, sessionToken);
  }

  @Post("directions")
  directions(@Body() dto: DirectionsDto) {
    return this.geoService.directions(dto.origin.toGeoPoint(), dto.destination.toGeoPoint());
  }
}
