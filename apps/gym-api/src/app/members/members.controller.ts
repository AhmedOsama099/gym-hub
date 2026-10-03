import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  ParseUUIDPipe,
  Delete,
} from "@nestjs/common";
import { MembersService } from "./members.service";
import { CreateMemberDto } from "./dto/create-member.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "@prisma/client";
import { UpdateMemberDto } from "./dto/update-member.dto";
import { RenewSubscriptionDto } from "./dto/renew-subscription.dto";

@Controller("members")
@UseGuards(JwtAuthGuard, RolesGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  @Roles(Role.ADMIN, Role.STAFF)
  @HttpCode(HttpStatus.CREATED)
  async createMember(@Body() dto: CreateMemberDto) {
    return this.membersService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN, Role.STAFF, Role.TRAINER)
  async getMembers() {
    return this.membersService.findAll();
  }

  @Patch(":id")
  @Roles(Role.ADMIN, Role.STAFF)
  async updateMember(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.membersService.update(id, dto);
  }

  @Delete(":id")
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async deleteMember(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.membersService.remove(id);
  }

  @Post(":id/renew")
  @Roles(Role.ADMIN, Role.STAFF)
  @HttpCode(HttpStatus.CREATED)
  async renewSubscription(
    @Param("id", new ParseUUIDPipe()) id: string,
    @Body() dto: RenewSubscriptionDto,
  ) {
    return this.membersService.renewSubscription(id, dto);
  }
}
