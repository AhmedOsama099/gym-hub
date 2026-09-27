import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpsertPlanDto } from "./dto/upsert-plan.dto";

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

  async createPlan(data: UpsertPlanDto) {
    const plan = await this.prisma.plan.create({
      data,
    });

    return {
      message: "Plan created successfully",
      plan,
    };
  }

  async updatePlan(id: string, data: UpsertPlanDto) {
    if (!id) {
      throw new BadRequestException("Plan ID is required for updating");
    }

    const exists = await this.prisma.plan.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    const plan = await this.prisma.plan.update({
      where: { id },
      data,
    });

    return {
      message: "Plan updated successfully",
      plan,
    };
  }

  async removePlan(id: string) {
    const exists = await this.prisma.plan.findUnique({ where: { id } });
    if (!exists) {
      throw new NotFoundException(`Plan with ID ${id} not found`);
    }

    await this.prisma.plan.delete({
      where: { id },
    });

    return {
      message: "Plan deleted successfully",
    };
  }
}
