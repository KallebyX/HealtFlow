import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@/database/prisma.service';
import { JwtPayload } from '../interfaces/auth.interface';
import { UserStatus } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      issuer: configService.get<string>('JWT_ISSUER', 'healthflow'),
      audience: configService.get<string>('JWT_AUDIENCE', 'healthflow-api'),
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        patient: {
          select: {
            id: true,
            fullName: true,
            socialName: true,
            level: true,
            levelName: true,
            totalPoints: true,
          },
        },
        doctor: {
          select: {
            id: true,
            fullName: true,
            crm: true,
            crmState: true,
            specialties: true,
            profilePhotoUrl: true,
            telemedicineEnabled: true,
          },
        },
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            department: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new UnauthorizedException('Conta inativa');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new UnauthorizedException('Conta suspensa');
    }

    // Verificar se a senha foi alterada após a emissão do token
    if (user.passwordChangedAt && payload.iat) {
      const passwordChangedTimestamp = Math.floor(
        user.passwordChangedAt.getTime() / 1000,
      );
      if (payload.iat < passwordChangedTimestamp) {
        throw new UnauthorizedException('Senha alterada. Faça login novamente.');
      }
    }

    // Retornar dados do usuário para injeção no request
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      twoFactorEnabled: user.twoFactorEnabled,
      emailVerified: user.emailVerified,
      patient: user.patient,
      doctor: user.doctor,
      employee: user.employee,
    };
  }
}
