import {
  BadRequestException,
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
}
