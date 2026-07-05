import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { GeoPointDto } from "../../common/dto/geo-point.dto";

export class CreateRideDto {
  @ValidateNested()
  @Type(() => GeoPointDto)
  origin!: GeoPointDto;

  @ValidateNested()
  @Type(() => GeoPointDto)
  destination!: GeoPointDto;
}
