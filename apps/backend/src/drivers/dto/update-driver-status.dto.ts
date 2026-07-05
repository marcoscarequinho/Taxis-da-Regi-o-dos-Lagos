import { IsBoolean, IsLatitude, IsLongitude, IsOptional } from "class-validator";

export class UpdateDriverStatusDto {
  @IsBoolean()
  isOnline!: boolean;

  @IsOptional()
  @IsLatitude()
  lat?: number;

  @IsOptional()
  @IsLongitude()
  lng?: number;
}
