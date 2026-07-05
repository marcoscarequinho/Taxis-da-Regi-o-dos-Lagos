import { RideStatus } from "./ride";

/** Emitted by driver clients every 3-5s while online or on an active ride. */
export interface DriverLocationEvent {
  driverId: string;
  rideId?: string | null;
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  timestamp: string;
}

/** Broadcast to passenger/driver rooms when a ride's status changes. */
export interface RideStatusEvent {
  rideId: string;
  status: RideStatus;
  driverId?: string | null;
}

/** Sent to a single driver socket when matched to a ride; expects an ack. */
export interface RideOfferEvent {
  rideId: string;
  passengerName: string;
  origin: { lat: number; lng: number; address: string };
  destination: { lat: number; lng: number; address: string };
  estimatedFare: number;
  distanceKm: number;
  offerExpiresAt: string;
}

export interface RideOfferAck {
  accepted: boolean;
}

export const REALTIME_EVENTS = {
  DRIVER_LOCATION: "driver:location",
  RIDE_STATUS: "ride:status",
  RIDE_OFFER: "ride:offer",
  RIDE_DRIVER_LOCATION: "ride:driverLocation",
  RIDE_CANCEL: "ride:cancel",
  RIDE_JOIN: "ride:join",
} as const;
