import { IsDateString, IsNotEmpty, IsOptional, IsUUID } from "class-validator";

export class RenewSubscriptionDto {
  @IsUUID("4", { message: "Valid Plan ID is required" })
  @IsNotEmpty({ message: "Plan ID is required" })
  planId: string;

  @IsOptional()
  @IsDateString({}, { message: "Start date must be a valid ISO date string" })
  startDate?: string;
}
