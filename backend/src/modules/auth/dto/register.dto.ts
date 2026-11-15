import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsBoolean } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  firstName: string;

  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  lastName: string;

  @IsNotEmpty({ message: 'Email address is required' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(12, { message: 'Use at least 12 characters. You can use a passphrase.' })
  password: string;

  @IsNotEmpty({ message: 'Country of residence is required' })
  @IsString()
  country: string;

  @IsNotEmpty({ message: 'Nationality is required' })
  @IsString()
  nationality: string;

  @IsOptional()
  @IsString()
  pathway?: string; // 'Employment & Career Opportunities' or 'Education & Scholarship Opportunities'

  @IsOptional()
  @IsBoolean()
  agreeToTerms?: boolean;
}
