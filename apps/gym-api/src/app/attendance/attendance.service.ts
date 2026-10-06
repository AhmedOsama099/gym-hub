import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CheckInDto } from "./dto/check-in.dto";
import { Role, SubscriptionStatus } from "@prisma/client";

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * تسجيل حضور عضو والتحقق من صلاحية اشتراكه
   */
  async checkIn(dto: CheckInDto) {
    const identifier = dto.identifier.trim();

    // 1. البحث عن العضو إما برقم الهاتف أو الـ ID
    const member = await this.prisma.user.findFirst({
      where: {
        role: Role.MEMBER,
        OR: [{ id: identifier }, { phoneNumber: identifier }],
      },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            plan: true,
          },
        },
      },
    });

    if (!member) {
      throw new NotFoundException("Member not found with this identifier");
    }

    // 2. التحقق من وجود اشتراك
    const latestSubscription = member.subscriptions[0];
    if (!latestSubscription) {
      throw new BadRequestException("Member has no subscription history");
    }

    // 3. التحقق من حالة الاشتراك
    if (latestSubscription.status === SubscriptionStatus.FROZEN) {
      throw new BadRequestException(
        "Subscription is currently frozen. Please unfreeze it at the desk.",
      );
    }

    const now = new Date();
    const expiryDate = new Date(latestSubscription.endDate);

    // إذا كانت الحالة منتهية أو التاريخ تخطى النهاية
    if (
      latestSubscription.status === SubscriptionStatus.EXPIRED ||
      expiryDate.getTime() < now.getTime()
    ) {
      // تحديث الحالة تلقائياً إلى EXPIRED لو كانت ما زالت مسجلة ACTIVE
      if (latestSubscription.status === SubscriptionStatus.ACTIVE) {
        await this.prisma.subscription.update({
          where: { id: latestSubscription.id },
          data: { status: SubscriptionStatus.EXPIRED },
        });
      }

      throw new BadRequestException(
        `Subscription expired on ${expiryDate.toLocaleDateString()}. Please renew.`,
      );
    }

    if (latestSubscription.status !== SubscriptionStatus.ACTIVE) {
      throw new BadRequestException(
        `Subscription is not active (Status: ${latestSubscription.status})`,
      );
    }

    // 4. منع تسجيل الحضور المزدوج بالخطأ (Double Check-in خلال 10 دقائق مثلاً)
    const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

    const recentCheckIn = await this.prisma.attendanceLog.findFirst({
      where: {
        userId: member.id,
        checkInAt: {
          gte: tenMinutesAgo,
        },
      },
      orderBy: { checkInAt: "desc" },
    });

    if (recentCheckIn) {
      throw new ConflictException(
        "Member already checked in within the last 10 minutes",
      );
    }

    // 5. تسجيل الحضور في قاعدة البيانات
    const attendanceLog = await this.prisma.attendanceLog.create({
      data: {
        userId: member.id,
        checkInAt: now,
      },
    });

    // 6. حساب عدد الأيام المتبقية للاشتراك
    const diffTime = expiryDate.getTime() - now.getTime();
    const remainingDays = Math.max(
      0,
      Math.ceil(diffTime / (1000 * 60 * 60 * 24)),
    );

    return {
      message: "Check-in successful. Welcome!",
      data: {
        attendanceId: attendanceLog.id,
        checkInAt: attendanceLog.checkInAt,
        member: {
          id: member.id,
          firstName: member.firstName,
          lastName: member.lastName,
          phoneNumber: member.phoneNumber,
        },
        plan: {
          name: latestSubscription.plan.name,
          endDate: latestSubscription.endDate,
          remainingDays,
        },
      },
    };
  }

  /**
   * جلب سجلات حضور اليوم الحالي
   */
  async getTodayAttendance() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const logs = await this.prisma.attendanceLog.findMany({
      where: {
        checkInAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      orderBy: { checkInAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            subscriptions: {
              orderBy: { createdAt: "desc" },
              take: 1,
              include: {
                plan: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    return {
      totalToday: logs.length,
      logs: logs.map((log) => ({
        id: log.id,
        checkInAt: log.checkInAt,
        member: {
          id: log.user.id,
          firstName: log.user.firstName,
          lastName: log.user.lastName,
          phoneNumber: log.user.phoneNumber,
          currentPlan: log.user.subscriptions[0]?.plan?.name || "N/A",
        },
      })),
    };
  }

  /**
   * جلب تاريخ حضور عضو محدد
   */
  async getMemberAttendanceHistory(memberId: string) {
    const member = await this.prisma.user.findFirst({
      where: { id: memberId, role: Role.MEMBER },
    });

    if (!member) {
      throw new NotFoundException("Member not found");
    }

    const logs = await this.prisma.attendanceLog.findMany({
      where: { userId: memberId },
      orderBy: { checkInAt: "desc" },
    });

    return {
      totalVisits: logs.length,
      logs,
    };
  }
}
