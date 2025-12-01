import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@/database/prisma.service';
import { UserStatus } from '@prisma/client';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly prisma: PrismaService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            socialName: true,
          },
        },
        doctor: {
          select: {
            id: true,
            fullName: true,
            crm: true,
            crmState: true,
          },
        },
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar bloqueio de conta
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new UnauthorizedException(
        `Conta bloqueada. Tente novamente em ${minutesRemaining} minutos.`,
      );
    }

    // Verificar status
    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Conta inativa');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Conta suspensa');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Incrementar tentativas falhas
      const failedAttempts = (user.loginAttempts || 0) + 1;
      const MAX_ATTEMPTS = 5;
      const LOCK_TIME_MINUTES = 30;

      const updateData: any = { loginAttempts: failedAttempts };

      if (failedAttempts >= MAX_ATTEMPTS) {
        updateData.lockedUntil = new Date(
          Date.now() + LOCK_TIME_MINUTES * 60 * 1000,
        );
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Login bem-sucedido - resetar tentativas
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // Remover dados sensíveis antes de retornar
    const { passwordHash, twoFactorSecret, ...result } = user;

    return result;
  }
}
