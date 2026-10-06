import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";
import { CheckInDto } from "./dto/check-in.dto";
import { AttendanceService } from "./attendance.service";
import { Role } from "@prisma/client";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../auth/guards/roles.guard";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../auth/decorators/roles.decorator";

@Controller("attendance")
@UseGuards(JwtAuthGuard, RolesGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /**
   * تسجيل حضور عضو والتحقق الفوري من اشتراكه
   * الصلاحية: موظف الاستقبال أو الأدمن
   */
  @Post("check-in")
  @Roles(Role.ADMIN, Role.STAFF)
  @HttpCode(HttpStatus.OK)
  async checkIn(@Body() dto: CheckInDto) {
    return this.attendanceService.checkIn(dto);
  }

  /**
   * جلب سجلات حضور اليوم الحالي لشاشة الاستقبال
   * الصلاحية: موظف الاستقبال أو الأدمن
   */
  @Get("today")
  @Roles(Role.ADMIN, Role.STAFF)
  async getTodayAttendance() {
    return this.attendanceService.getTodayAttendance();
  }

  @Get("member/:memberId")
  @Roles(Role.ADMIN, Role.STAFF, Role.TRAINER)
  async getMemberAttendance(
    @Param("memberId", new ParseUUIDPipe()) memberId: string,
  ) {
    return this.attendanceService.getMemberAttendanceHistory(memberId);
  }
}
