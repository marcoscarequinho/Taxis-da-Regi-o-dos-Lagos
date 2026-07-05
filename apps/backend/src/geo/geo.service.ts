import { BadGatewayException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { HttpService } from "@nestjs/axios";
import { firstValueFrom } from "rxjs";
import type { GeoPoint } from "@moveapp/shared";

export interface DirectionsResult {
  distanceKm: number;
  durationMin: number;
  routePolyline: string;
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
}

function toDirectionsParam(point: GeoPoint): string {
  return "placeId" in point ? `place_id:${point.placeId}` : `${point.lat},${point.lng}`;
}

export interface AutocompleteResult {
  placeId: string;
  description: string;
}

@Injectable()
export class GeoService {
  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async autocomplete(input: string, sessionToken?: string): Promise<AutocompleteResult[]> {
    const apiKey = this.config.get<string>("googleMapsApiKey");
    try {
      const { data } = await firstValueFrom(
        this.http.get("https://maps.googleapis.com/maps/api/place/autocomplete/json", {
          params: {
            input,
            key: apiKey,
            sessiontoken: sessionToken,
            language: "pt-BR",
            components: "country:br",
          },
        }),
      );

      return (data.predictions ?? []).map((p: any) => ({
        placeId: p.place_id,
        description: p.description,
      }));
    } catch (error) {
      throw new BadGatewayException("Falha ao consultar autocomplete de endereços");
    }
  }

  async directions(origin: GeoPoint, destination: GeoPoint): Promise<DirectionsResult> {
    const apiKey = this.config.get<string>("googleMapsApiKey");
    try {
      const { data } = await firstValueFrom(
        this.http.get("https://maps.googleapis.com/maps/api/directions/json", {
          params: {
            origin: toDirectionsParam(origin),
            destination: toDirectionsParam(destination),
            key: apiKey,
            language: "pt-BR",
            departure_time: "now",
          },
        }),
      );

      const route = data.routes?.[0];
      const leg = route?.legs?.[0];
      if (!route || !leg) {
        throw new Error("Nenhuma rota encontrada");
      }

      return {
        distanceKm: leg.distance.value / 1000,
        durationMin: (leg.duration_in_traffic ?? leg.duration).value / 60,
        routePolyline: route.overview_polyline.points,
        origin: {
          lat: leg.start_location.lat,
          lng: leg.start_location.lng,
          address: leg.start_address,
        },
        destination: {
          lat: leg.end_location.lat,
          lng: leg.end_location.lng,
          address: leg.end_address,
        },
      };
    } catch (error) {
      throw new BadGatewayException("Falha ao calcular rota");
    }
  }
}
