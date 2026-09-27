import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { PlansModule } from "./plans/plans.module";
import { MembersModule } from "./members/members.module";

@Module({
  imports: [PrismaModule, AuthModule, PlansModule, MembersModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
