import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { PrismaService } from "../../prisma/prisma.service";
import { Request } from "express";

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          return request?.cookies?.access_token;
        },
        ExtractJwt.fromAuthHeaderAsBearerToken(), // كدعم إضافي للـ Postman
      ]),

      ignoreExpiration: false,
      secretOrKey:
        process.env["JWT_SECRET"] || "gym_hub_super_secret_jwt_key_2026",
    });
  }

  // تُنفذ تلقائياً بمجرد التحقق من صحة التوقيع الرقمي للتوكن
  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException(
        "المستخدم المرتبط بهذا الرمز لم يعد موجوداً",
      );
    }
    return user;
  }
}
