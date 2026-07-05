import { PaymentMethod } from "./ride";

export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

export interface PaymentSummary {
  id: string;
  rideId: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  providerTransactionId?: string | null;
  paidAt?: string | null;
}
