import { IsString, MinLength } from "class-validator";

export class RegisterDriverDto {
  @IsString()
  @MinLength(5)
  cnhNumber!: string;

  @IsString()
  cnhDocUrl!: string;
}
