export interface UserSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  isDriver: boolean;
  isPassenger: boolean;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface DriverProfileSummary {
  userId: string;
  cnhNumber: string;
  backgroundCheckStatus: BackgroundCheckStatus;
  isOnline: boolean;
  ratingAvg: number;
  vehicle?: VehicleSummary | null;
}

export type BackgroundCheckStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface VehicleSummary {
  id: string;
  plate: string;
  model: string;
  color: string;
  year: number;
}

export interface LatLng {
  lat: number;
  lng: number;
}
