import { Type } from "class-transformer";
import { IsInt, IsOptional, Min } from "class-validator";

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;

  get skip(): number {
    return ((this.page ?? 1) - 1) * (this.pageSize ?? 20);
  }

  get take(): number {
    return this.pageSize ?? 20;
  }
}
