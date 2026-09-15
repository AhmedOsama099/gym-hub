import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Role } from "@prisma/client";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { Roles } from "./decorators/roles.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { RolesGuard } from "./guards/roles.guard";
import { Response } from "express";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("register")
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  getProfile(@CurrentUser() user: any) {
    return {
      message: "تم التحقق من هويتك بنجاح",
      user,
    };
  }

  // مسار محمي يتطلب: توكن سليم + دور ADMIN فقط
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get("admin-only")
  getAdminData(@CurrentUser() user: any) {
    return {
      message: "أهلاً بك في لوحة تحكم الإدارة العليا",
      admin: user,
    };
  }

  @Post("logout")
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) response: Response) {
    // حذف الكوكي بتعيين تاريخ انتهاء قديم أو قيمة فارغة
    response.clearCookie("access_token", {
      httpOnly: true,
      secure: false, // اجعلها true في Production مع HTTPS
      sameSite: "lax",
      path: "/login",
    });

    return { message: "Logged out successfully" };
  }
}
