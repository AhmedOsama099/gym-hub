import { PackageType } from "@prisma/client";
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty({ message: "Plan name is required" })
  name: string;

  @Type(() => Number)
  @IsNumber()
  @IsPositive({ message: "Plan price must be greater than zero" })
  price: number;

  @IsInt({ message: "Duration must be an integer (whole months)" })
  @Min(1, { message: "Duration must be at least 1 month" })
  duration: number;

  @IsEnum(PackageType, {
    message: `Invalid package type. Acceptable values: ${Object.values(PackageType).join(", ")}`,
  })
  type: PackageType;

  @IsOptional()
  @IsString()
  description?: string;
}
