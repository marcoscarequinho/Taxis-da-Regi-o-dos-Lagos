import { LatLng } from "./user";

export type RideStatus =
  | "REQUESTED"
  | "SEARCHING"
  | "ACCEPTED"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

/** Somente Pix é aceito: o split (80% motorista / 20% plataforma) é feito no momento do pagamento. */
export type PaymentMethod = "PIX";

/** Either a resolved coordinate (e.g. from GPS) or a Google Places `place_id` (from autocomplete). */
export type GeoPoint = LatLng | { placeId: string };

export interface RideEstimateRequest {
  origin: GeoPoint;
  destination: GeoPoint;
}

export interface RideEstimateResponse {
  distanceKm: number;
  durationMin: number;
  estimatedFare: number;
  routePolyline: string;
  origin: LatLng & { address: string };
  destination: LatLng & { address: string };
}

export interface CreateRideRequest {
  origin: GeoPoint;
  destination: GeoPoint;
}

export interface RideSummary {
  id: string;
  status: RideStatus;
  passengerId: string;
  driverId?: string | null;
  origin: LatLng & { address: string };
  destination: LatLng & { address: string };
  distanceKm?: number | null;
  durationMin?: number | null;
  estimatedFare?: number | null;
  finalFare?: number | null;
  paymentMethod: PaymentMethod;
  routePolyline?: string | null;
  requestedAt: string;
  acceptedAt?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  cancelledAt?: string | null;
}
