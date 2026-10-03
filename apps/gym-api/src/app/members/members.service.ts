import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common";
import { CreateMemberDto } from "./dto/create-member.dto";
import { Role, SubscriptionStatus } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { RenewSubscriptionDto } from "./dto/renew-subscription.dto";
@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateMemberDto) {
    // 1. التحقق من وجود الباقة للحصول على عدد الشهور لحساب تاريخ الانتهاء
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID "${dto.planId}" not found`);
    }

    // 2. التحقق المسبق من عدم تكرار البريد أو رقم الهاتف
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: dto.phoneNumber },
          ...(dto.email ? [{ email: dto.email }] : []),
        ],
      },
    });

    if (existingUser) {
      if (existingUser.phoneNumber === dto.phoneNumber) {
        throw new ConflictException(
          "A user with this phone number already exists",
        );
      }
      if (dto.email && existingUser.email === dto.email) {
        throw new ConflictException("A user with this email already exists");
      }
    }

    // 3. توليد كلمة مرور عشوائية قوية وتشفيرها
    const temporaryPassword = crypto.randomBytes(8).toString("hex"); // 16 حرف عشوائي
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(temporaryPassword, saltRounds);

    // 4. تحديد تواريخ الاشتراك
    const startDateTime = dto.startDate ? new Date(dto.startDate) : new Date();
    const endDateTime = new Date(startDateTime);
    // إضافة عدد شهور الباقة
    endDateTime.setMonth(endDateTime.getMonth() + plan.duration);

    // 5. التنفيذ داخل Prisma Transaction لضمان الذرية (Atomicity)
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // إنشاء المستخدم بدور MEMBER
        const user = await tx.user.create({
          data: {
            firstName: dto.firstName,
            lastName: dto.lastName,
            phoneNumber: dto.phoneNumber,
            email: dto.email,
            gender: dto.gender,
            dateOfBirth: dto.dateOfBirth,
            passwordHash,
            role: Role.MEMBER,
          },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phoneNumber: true,
            email: true,
            gender: true,
            dateOfBirth: true,
            role: true,
            createdAt: true,
          },
        });

        // إنشاء أول اشتراك مرتبط بالعضو والباقة
        const subscription = await tx.subscription.create({
          data: {
            userId: user.id,
            planId: plan.id,
            startDate: startDateTime,
            endDate: endDateTime,
            status: SubscriptionStatus.ACTIVE,
          },
          include: {
            plan: true,
          },
        });

        return {
          user,
          subscription,
          // يمكن إرجاع الباسورد المؤقت فقط إذا كنت تود إظهاره للريسبشن أو إرساله في SMS
          temporaryPassword,
        };
      });

      return {
        message: "Member and subscription created successfully",
        data: result,
      };
    } catch (error) {
      if (
        error instanceof ConflictException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        "Failed to create member and subscription: " + error.message,
      );
    }
  }

  // دالة جلب قائمة الأعضاء مع اشتراكاتهم الحالية (مفيدة للجدول في الفرونت)
  async findAll() {
    return this.prisma.user.findMany({
      where: {
        role: Role.MEMBER,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        email: true,
        gender: true,
        dateOfBirth: true,
        createdAt: true,
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1, // جلب آخر اشتراك فقط لمعرفة حالته
          include: {
            plan: {
              select: {
                name: true,
                type: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  // أضف هذه الدوال داخل كلاس MembersService:

  /**
   * 1. تعديل البيانات الشخصية للعضو
   */
  async update(id: string, dto: UpdateMemberDto) {
    // التحقق من وجود العضو
    const member = await this.prisma.user.findFirst({
      where: { id, role: Role.MEMBER },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID "${id}" not found`);
    }

    // التحقق من عدم تكرار الهاتف أو البريد مع مستخدم آخر
    if (dto.phoneNumber || dto.email) {
      const conflictUser = await this.prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(dto.phoneNumber ? [{ phoneNumber: dto.phoneNumber }] : []),
            ...(dto.email ? [{ email: dto.email }] : []),
          ],
        },
      });

      if (conflictUser) {
        if (conflictUser.phoneNumber === dto.phoneNumber) {
          throw new ConflictException(
            "Phone number is already taken by another user",
          );
        }
        if (dto.email && conflictUser.email === dto.email) {
          throw new ConflictException("Email is already taken by another user");
        }
      }
    }

    const updatedMember = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        email: true,
        gender: true,
        dateOfBirth: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      message: "Member profile updated successfully",
      data: updatedMember,
    };
  }

  /**
   * 2. حذف العضو (مع اشتراكاته تلقائياً عبر onDelete: Cascade)
   */
  async remove(id: string) {
    const member = await this.prisma.user.findFirst({
      where: { id, role: Role.MEMBER },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID "${id}" not found`);
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return {
      message: `Member "${member.firstName} ${member.lastName}" deleted successfully`,
    };
  }

  /**
   * 3. تجديد الاشتراك (Renew Subscription)
   */
  async renewSubscription(userId: string, dto: RenewSubscriptionDto) {
    // التأكد من العضو
    const member = await this.prisma.user.findFirst({
      where: { id: userId, role: Role.MEMBER },
      include: {
        subscriptions: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!member) {
      throw new NotFoundException(`Member with ID "${userId}" not found`);
    }

    // التأكد من الباقة
    const plan = await this.prisma.plan.findUnique({
      where: { id: dto.planId },
    });

    if (!plan) {
      throw new NotFoundException(`Plan with ID "${dto.planId}" not found`);
    }

    // حساب تواريخ الاشتراك الجديد
    // إذا كان للعضو اشتراك حالي فعال ينتهي في المستقبل، يبدأ التجديد من لحظة انتهائه، وإلا يبدأ من الآن
    const latestSub = member.subscriptions[0];
    const now = new Date();

    let startDateTime = dto.startDate ? new Date(dto.startDate) : now;
    if (
      !dto.startDate &&
      latestSub &&
      latestSub.endDate > now &&
      latestSub.status === SubscriptionStatus.ACTIVE
    ) {
      startDateTime = new Date(latestSub.endDate);
    }

    const endDateTime = new Date(startDateTime);
    endDateTime.setMonth(endDateTime.getMonth() + plan.duration);

    // تحديث الاشتراكات السابقة السارية إلى EXPIRED ثم إنشاء الاشتراك الجديد داخل Transaction
    const newSubscription = await this.prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: {
          userId,
          status: SubscriptionStatus.ACTIVE,
        },
        data: {
          status: SubscriptionStatus.EXPIRED,
        },
      });

      return tx.subscription.create({
        data: {
          userId,
          planId: plan.id,
          startDate: startDateTime,
          endDate: endDateTime,
          status: SubscriptionStatus.ACTIVE,
        },
        include: {
          plan: true,
        },
      });
    });

    return {
      message: "Subscription renewed successfully",
      data: newSubscription,
    };
  }
}
