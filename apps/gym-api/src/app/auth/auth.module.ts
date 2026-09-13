import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./strategies/jwt.strategy";
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    JwtModule.register({
      global: true, // يتيح استخدام JwtService في أي مكان داخل التطبيق
      secret: process.env["JWT_SECRET"] || "gym_hub_super_secret_jwt_key_2026",
      signOptions: { expiresIn: "7d" }, // صلاحية التوكن 7 أيام
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
