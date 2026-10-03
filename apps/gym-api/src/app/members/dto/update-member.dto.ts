import { GenderType } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
} from "class-validator";

export class UpdateMemberDto {
  @IsOptional()
  @IsString({ message: "First name must be a string" })
  firstName?: string;

  @IsOptional()
  @IsString({ message: "Last name must be a string" })
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9+ ]{9,15}$/, { message: "Invalid phone number format" })
  phoneNumber?: string;

  @IsOptional()
  @IsEmail({}, { message: "Email is invalid" })
  email?: string;

  @IsOptional()
  @IsEnum(GenderType, { message: "Gender is invalid" })
  gender?: GenderType;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: "Date of birth must be a valid date" })
  dateOfBirth?: Date;
}
