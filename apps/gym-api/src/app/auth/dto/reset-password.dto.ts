import {
  IsNotEmpty,
  IsString,
  Length,
  max,
  MaxLength,
  MinLength,
} from "class-validator";

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty({ message: "Token is required" })
  token: string;

  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters" })
  @MaxLength(30, { message: "Password must be at most 30 characters" })
  newPassword: string;
}
