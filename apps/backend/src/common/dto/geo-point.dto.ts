import { IsLatitude, IsLongitude, IsOptional, IsString, ValidateIf } from "class-validator";
import type { GeoPoint } from "@moveapp/shared";

/** Accepts either { lat, lng } (e.g. from GPS) or { placeId } (from Places autocomplete). */
export class GeoPointDto {
  @ValidateIf((o) => !o.placeId)
  @IsLatitude()
  lat?: number;

  @ValidateIf((o) => !o.placeId)
  @IsLongitude()
  lng?: number;

  @IsOptional()
  @IsString()
  placeId?: string;

  toGeoPoint(): GeoPoint {
    return this.placeId ? { placeId: this.placeId } : { lat: this.lat as number, lng: this.lng as number };
  }
}
