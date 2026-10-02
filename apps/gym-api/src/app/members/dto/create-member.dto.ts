import { GenderType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsDate,
  IsDateString,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
} from "class-validator";

export class CreateMemberDto {
  @IsString({ message: "First name must be a string" })
  @IsNotEmpty({ message: "First name is required" })
  firstName: string;

  @IsString({ message: "Last name must be a string" })
  @IsNotEmpty({ message: "Last name is required" })
  lastName: string;

  @IsString()
  @IsNotEmpty({ message: "Phone number is required" })
  @Matches(/^[0-9+ ]{9,15}$/, { message: "Invalid phone number format" })
  phoneNumber: string;

  @IsOptional()
  @IsEmail({}, { message: "Email is invalid" })
  email?: string;

  @IsEnum(GenderType, { message: "Gender is invalid" })
  @IsNotEmpty({ message: "Gender is required" })
  gender: GenderType;

  @Type(() => Date)
  @IsDate({ message: "Date of birth must be a valid date" })
  @IsNotEmpty({ message: "Date of birth is required" })
  dateOfBirth: Date;

  @IsUUID("4", { message: "Valid Plan ID is required" })
  @IsNotEmpty({ message: "Plan ID is required" })
  planId: string;

  @IsOptional()
  @IsDateString({}, { message: "Start date must be a valid ISO date string" })
  startDate?: string;
}
