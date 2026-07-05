import { Body, Controller, Get, Patch, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtPayload } from "../auth/jwt-payload.interface";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { SwitchModeDto } from "./dto/switch-mode.dto";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  findMe(@CurrentUser() user: JwtPayload) {
    return this.usersService.findMe(user.sub);
  }

  @Patch("me")
  update(@CurrentUser() user: JwtPayload, @Body() dto: UpdateUserDto) {
    return this.usersService.update(user.sub, dto);
  }

  @Post("me/mode")
  switchMode(@CurrentUser() user: JwtPayload, @Body() dto: SwitchModeDto) {
    return this.usersService.switchMode(user.sub, dto);
  }
}
