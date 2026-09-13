import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsEmail({}, { message: "You must enter a valid email" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;

  @IsString()
  @MinLength(6, { message: "Password must be at least 6 characters" })
  password: string;

  @IsString()
  @IsNotEmpty({ message: "First name is required" })
  firstName: string;

  @IsString()
  @IsNotEmpty({ message: "Last name is required" })
  lastName: string;
}
