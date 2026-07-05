import { IsEmail } from "class-validator";

export class PayRideDto {
  @IsEmail()
  payerEmail!: string;
}
