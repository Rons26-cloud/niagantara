import { IsEmail,IsString,Length,MinLength,IsOptional } from 'class-validator';
export class RegisterDto{@IsEmail() email!:string; @IsString() @MinLength(12) password!:string; @IsString() @MinLength(2) companyName!:string; @IsOptional() @IsString() fullName?:string}
export class LoginDto{@IsEmail() email!:string; @IsString() @MinLength(1) password!:string}
export class ForgotPasswordDto{@IsEmail() email!:string}
export class VerifyRecoveryDto{@IsEmail() email!:string; @IsString() @Length(6,8) otp!:string}
export class ResetPasswordDto{@IsString() @MinLength(12) password!:string; @IsString() @MinLength(12) confirmPassword!:string; @IsString() @MinLength(1) refreshToken!:string}
