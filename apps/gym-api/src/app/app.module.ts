import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PlansModule } from "./plans/plans.module";
import { MembersModule } from "./members/members.module";
import { AttendanceModule } from "./attendance/attendance.module";

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    PlansModule,
    MembersModule,
    AttendanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

