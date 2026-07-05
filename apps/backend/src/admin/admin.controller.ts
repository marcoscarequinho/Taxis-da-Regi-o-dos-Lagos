import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { AdminGuard } from "../auth/guards/admin.guard";
import { AdminService } from "./admin.service";
import { PaginationDto } from "../common/dto/pagination.dto";

@UseGuards(JwtAuthGuard, AdminGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("users")
  listUsers(@Query() pagination: PaginationDto) {
    return this.adminService.listUsers(pagination);
  }

  @Get("rides")
  listRides(@Query() pagination: PaginationDto) {
    return this.adminService.listRides(pagination);
  }
}
