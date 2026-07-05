import { IsInt, IsString, Max, Min, MinLength } from "class-validator";

export class CreateVehicleDto {
  @IsString()
  @MinLength(6)
  plate!: string;

  @IsString()
  @MinLength(2)
  model!: string;

  @IsString()
  @MinLength(3)
  color!: string;

  @IsInt()
  @Min(1990)
  @Max(new Date().getFullYear() + 1)
  year!: number;
}
