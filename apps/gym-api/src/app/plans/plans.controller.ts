import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from "@nestjs/common";
import { PlansService } from "./plans.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "@prisma/client";
import { RolesGuard } from "../auth/guards/roles.guard";
import { CreatePlanDto } from "./dto/create-plan.dto";

@Controller("plans")
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getAll() {
    return this.plansService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async create(@Body() dto: CreatePlanDto) {
    const result = await this.plansService.createPlan(dto);
    return result;
  }
}
