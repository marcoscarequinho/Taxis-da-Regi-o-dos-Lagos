export interface CreateRatingRequest {
  score: number;
  comment?: string;
}

export interface RatingSummary {
  id: string;
  rideId: string;
  fromUserId: string;
  toUserId: string;
  score: number;
  comment?: string | null;
  createdAt: string;
}
