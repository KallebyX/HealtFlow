import {
  IsEmail,
  IsString,
  IsNotEmpty,
  MinLength,
  IsOptional,
  Length,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'usuario@email.com',
    description: 'Email do usuário',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;

  @ApiProperty({
    example: 'Senha@123',
    description: 'Senha do usuário',
  })
  @IsString()
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  password: string;

  @ApiPropertyOptional({
    example: '123456',
    description: 'Código 2FA (se habilitado)',
  })
  @IsOptional()
  @IsString()
  @Length(6, 6, { message: 'Código 2FA deve ter 6 dígitos' })
  twoFactorCode?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Manter sessão ativa por mais tempo',
  })
  @IsOptional()
  rememberMe?: boolean;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'Refresh token válido',
  })
  @IsString()
  @IsNotEmpty({ message: 'Refresh token é obrigatório' })
  refreshToken: string;
}

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'usuario@email.com',
    description: 'Email cadastrado',
  })
  @IsEmail({}, { message: 'Email inválido' })
  @IsNotEmpty({ message: 'Email é obrigatório' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    example: 'abc123def456...',
    description: 'Token de recuperação enviado por email',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token é obrigatório' })
  token: string;

  @ApiProperty({
    example: 'NovaSenha@123',
    description: 'Nova senha (mínimo 8 caracteres)',
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    { message: 'Senha deve conter maiúscula, minúscula, número e caractere especial' },
  )
  newPassword: string;
}

export class ChangePasswordDto {
  @ApiProperty({
    example: 'SenhaAtual@123',
    description: 'Senha atual do usuário',
  })
  @IsString()
  @IsNotEmpty({ message: 'Senha atual é obrigatória' })
  currentPassword: string;

  @ApiProperty({
    example: 'NovaSenha@123',
    description: 'Nova senha',
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter no mínimo 8 caracteres' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    { message: 'Senha deve conter maiúscula, minúscula, número e caractere especial' },
  )
  newPassword: string;
}

export class VerifyEmailDto {
  @ApiProperty({
    example: 'abc123def456...',
    description: 'Token de verificação',
  })
  @IsString()
  @IsNotEmpty({ message: 'Token é obrigatório' })
  token: string;
}

export class Enable2FADto {
  @ApiProperty({
    example: '123456',
    description: 'Código do app autenticador',
  })
  @IsString()
  @Length(6, 6, { message: 'Código deve ter 6 dígitos' })
  code: string;
}

export class Disable2FADto {
  @ApiProperty({
    example: '123456',
    description: 'Código do app autenticador para confirmação',
  })
  @IsString()
  @Length(6, 6, { message: 'Código deve ter 6 dígitos' })
  code: string;
}

export class Verify2FADto {
  @ApiProperty({
    example: '123456',
    description: 'Código 2FA para verificação',
  })
  @IsString()
  @Length(6, 6)
  code: string;
}

export class ResendVerificationDto {
  @ApiProperty({
    example: 'usuario@email.com',
    description: 'Email para reenviar verificação',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
