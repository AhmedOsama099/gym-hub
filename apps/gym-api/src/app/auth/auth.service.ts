import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as crypto from "crypto";
import * as bcrypt from "bcrypt";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException("Incorrect login credentials");
    }

    const token = await this.generateToken(user.id, user.email, user.role);

    return {
      message: "User logged in successfully",
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken: token,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // نعيد رداً ناجحاً دائماً حتى لو لم يكن الإيميل مسجلاً لمنع هجمات Email Enumeration
    if (!user) {
      return {
        message:
          "If the email is registered, you will receive a message with recovery instructions",
      };
    }

    // إنشاء توكن عشوائي غير مشفر لإرساله في الرابط
    const rawToken = crypto.randomBytes(32).toString("hex");

    // تشفير التوكن قبل حفظه في قاعدة البيانات
    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    // صلاحية التوكن: ساعة واحدة فقط
    const tokenExpires = new Date(Date.now() + 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: tokenExpires,
      },
    });

    const resetLink = `http://localhost:4200/reset-password?token=${rawToken}`;

    return {
      message:
        "If the email is registered, you will receive a message with recovery instructions",
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hashedToken = crypto
      .createHash("sha256")
      .update(dto.token)
      .digest("hex");

    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpires: { gt: new Date() }, // التحقق من أن التوكن لم ينتهِ
      },
    });

    if (!user) {
      throw new BadRequestException("رمز الاستعادة غير صالح أو انتهت صلاحيته");
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(dto.newPassword, salt);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    return { message: "تم تحديث كلمة المرور بنجاح، يمكنك الآن تسجيل الدخول" };
  }

  private async generateToken(
    userId: string,
    email: string,
    role: string,
  ): Promise<string> {
    const payload = { sub: userId, email, role };
    return this.jwtService.signAsync(payload);
  }
}
