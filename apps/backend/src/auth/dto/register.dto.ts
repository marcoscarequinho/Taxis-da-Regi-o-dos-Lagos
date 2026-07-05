import { IsBoolean, IsEmail, IsOptional, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsOptional()
  @IsBoolean()
  isDriver?: boolean;
}
