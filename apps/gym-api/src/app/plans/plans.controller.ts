import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
  ParseUUIDPipe,
} from "@nestjs/common";
import { PlansService } from "./plans.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "@prisma/client";
import { RolesGuard } from "../auth/guards/roles.guard";
import { UpsertPlanDto } from "./dto/upsert-plan.dto";

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
  async create(@Body() dto: UpsertPlanDto) {
    const result = await this.plansService.createPlan(dto);
    return result;
  }

  @Patch(":id")
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpsertPlanDto,
  ) {
    return this.plansService.updatePlan(id, dto);
  }

  @Delete(":id")
  @Roles(Role.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  async remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.plansService.removePlan(id);
  }
}
