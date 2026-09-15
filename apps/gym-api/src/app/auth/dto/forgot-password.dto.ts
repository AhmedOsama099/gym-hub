import { IsEmail, IsNotEmpty } from "class-validator";

export class ForgotPasswordDto {
  @IsEmail({}, { message: "Please enter a valid email" })
  @IsNotEmpty({ message: "Email is required" })
  email: string;
}
