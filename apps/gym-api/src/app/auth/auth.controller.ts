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
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { Roles } from "./decorators/roles.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { RolesGuard } from "./guards/roles.guard";
import { Response } from "express";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    // 1. استدعاء السيرفيس للحصول على التوكن وبيانات المستخدم
    const result = await this.authService.login(dto);

    // لنفترض أن السيرفيس ترجع { accessToken: '...', user: {...} }
    // 2. زرع التوكن داخل HttpOnly Cookie في المتصفح
    response.cookie("access_token", result.accessToken, {
      httpOnly: true, // تمنع JavaScript في الفرونت من قراءة الكوكي (حماية من XSS)
      secure: process.env.NODE_ENV === "production", // false محلياً على localhost و true على الإنتاج
      sameSite: "lax", // تسمح بالتنقل الطبيعي بين الروابط
      path: "/", // الكوكي متاحة لكامل مسارات الـ API
      maxAge: 7 * 24 * 60 * 60 * 1000, // أسبوع بالمللي ثانية مثلاً
    });

    // 3. إرجاع بيانات المستخدم للفرونت إند (بدون التوكن أو معها)
    return {
      message: "تم تسجيل الدخول بنجاح",
      user: result.user,
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

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post("reset-password")
  @HttpCode(HttpStatus.OK)
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
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
}
