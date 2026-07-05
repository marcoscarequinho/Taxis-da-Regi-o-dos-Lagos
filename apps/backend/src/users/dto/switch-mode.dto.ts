import { IsIn } from "class-validator";

export class SwitchModeDto {
  @IsIn(["passenger", "driver"])
  mode!: "passenger" | "driver";
}
