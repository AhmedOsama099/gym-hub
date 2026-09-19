import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePlanDto } from "./dto/create-plan.dto";

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const plans = await this.prisma.plan.findMany({
      orderBy: { createdAt: "desc" },
    });

    return {
      message: "Plans fetched successfully",
      plans,
    };
  }

  async createPlan(dto: CreatePlanDto) {
    const plan = await this.prisma.plan.create({
      data: {
        ...dto,
      },
    });

    return {
      message: "Plan created successfully",
      plan,
    };
  }
}
