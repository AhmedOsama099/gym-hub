import { IsNotEmpty, IsString } from "class-validator";

export class CheckInDto {
  @IsString({ message: "Identifier must be a string" })
  @IsNotEmpty({ message: "Member identifier (phone number or ID) is required" })
  identifier: string;
}
