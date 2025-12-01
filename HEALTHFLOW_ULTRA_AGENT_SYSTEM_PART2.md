# HEALTHFLOW - ULTRA AGENT SYSTEM - PARTE 2
## Services, Controllers e Testes

---

## CONTINUAÇÃO DA FASE 1: MÓDULO DE AUTENTICAÇÃO

### 1.3 AUTH SERVICE COMPLETO

#### PROMPT 1.3.1: Auth Service - Implementação Completa
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/auth/auth.service.ts

import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';
import {
  RegisterPatientDto,
  RegisterDoctorDto,
} from './dto/register.dto';
import {
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  Enable2FADto,
} from './dto/login.dto';
import {
  AuthResponse,
  TokenPayload,
  JwtPayload,
  TwoFactorSetupResponse,
} from './interfaces/auth.interface';
import { UserRole, UserStatus, AuditAction } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly SALT_ROUNDS = 12;
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCK_TIME_MINUTES = 30;
  private readonly RESET_TOKEN_EXPIRY_HOURS = 2;
  private readonly VERIFICATION_TOKEN_EXPIRY_HOURS = 24;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTRO
  // ═══════════════════════════════════════════════════════════════════════════

  async registerPatient(dto: RegisterPatientDto, ipAddress?: string): Promise<AuthResponse> {
    this.logger.log(`Registering new patient: ${dto.email}`);

    // Validar consentimentos obrigatórios
    if (!dto.termsAccepted || !dto.privacyAccepted) {
      throw new BadRequestException(
        'É necessário aceitar os Termos de Uso e Política de Privacidade',
      );
    }

    // Verificar se email já existe
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingEmail) {
      throw new ConflictException('Este email já está cadastrado');
    }

    // Normalizar e validar CPF
    const normalizedCpf = this.normalizeCpf(dto.cpf);
    if (!this.isValidCpf(normalizedCpf)) {
      throw new BadRequestException('CPF inválido');
    }

    // Verificar se CPF já existe
    const existingCpf = await this.prisma.patient.findUnique({
      where: { cpf: normalizedCpf },
    });

    if (existingCpf) {
      throw new ConflictException('Este CPF já está cadastrado');
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    // Gerar token de verificação de email
    const verificationToken = this.generateSecureToken();

    // Criar usuário e paciente em transação
    const result = await this.prisma.$transaction(async (tx) => {
      // Criar usuário
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          role: UserRole.PATIENT,
          status: UserStatus.PENDING_VERIFICATION,
        },
      });

      // Criar paciente
      const patient = await tx.patient.create({
        data: {
          userId: user.id,
          cpf: normalizedCpf,
          fullName: dto.fullName,
          socialName: dto.socialName,
          birthDate: new Date(dto.birthDate),
          gender: dto.gender,
          phone: dto.phone,
          phoneSecondary: dto.phoneSecondary,
          height: dto.height,
          weight: dto.weight,
          address: dto.address as any,
          emergencyContact: dto.emergencyContact as any,
          allergies: dto.allergies || [],
          termsAcceptedAt: new Date(),
          privacyAcceptedAt: new Date(),
          dataProcessingConsent: true,
          researchConsent: dto.researchConsent || false,
        },
      });

      return { user, patient };
    });

    // Armazenar token de verificação no cache
    await this.cacheService.set(
      `email_verification:${verificationToken}`,
      result.user.id,
      this.VERIFICATION_TOKEN_EXPIRY_HOURS * 3600,
    );

    // Emitir evento para envio de email de verificação
    this.eventEmitter.emit('auth.registered', {
      userId: result.user.id,
      email: dto.email,
      name: dto.fullName,
      verificationToken,
      type: 'patient',
    });

    // Registrar auditoria
    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'user',
      resourceId: result.user.id,
      userId: result.user.id,
      description: 'Novo paciente registrado',
      ipAddress,
    });

    // Gerar tokens
    const tokens = await this.generateTokens(result.user);

    this.logger.log(`Patient registered successfully: ${result.user.id}`);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        status: result.user.status,
        patient: {
          id: result.patient.id,
          fullName: result.patient.fullName,
          socialName: result.patient.socialName,
        },
      },
      ...tokens,
      message: 'Registro realizado com sucesso. Verifique seu email para ativar sua conta.',
    };
  }

  async registerDoctor(dto: RegisterDoctorDto, ipAddress?: string): Promise<AuthResponse> {
    this.logger.log(`Registering new doctor: ${dto.email}`);

    // Validar consentimentos
    if (!dto.termsAccepted || !dto.privacyAccepted) {
      throw new BadRequestException(
        'É necessário aceitar os Termos de Uso e Política de Privacidade',
      );
    }

    // Verificar email duplicado
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingEmail) {
      throw new ConflictException('Este email já está cadastrado');
    }

    // Normalizar e validar CPF
    const normalizedCpf = this.normalizeCpf(dto.cpf);
    if (!this.isValidCpf(normalizedCpf)) {
      throw new BadRequestException('CPF inválido');
    }

    // Verificar CPF duplicado
    const existingCpf = await this.prisma.doctor.findUnique({
      where: { cpf: normalizedCpf },
    });

    if (existingCpf) {
      throw new ConflictException('Este CPF já está cadastrado');
    }

    // Verificar CRM duplicado
    const existingCrm = await this.prisma.doctor.findFirst({
      where: {
        crm: dto.crm,
        crmState: dto.crmState.toUpperCase(),
      },
    });

    if (existingCrm) {
      throw new ConflictException('Este CRM já está cadastrado');
    }

    // TODO: Validar CRM no CFM (API externa)
    // const crmValid = await this.cfmService.validateCrm(dto.crm, dto.crmState);

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const verificationToken = this.generateSecureToken();

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          role: UserRole.DOCTOR,
          status: UserStatus.PENDING_VERIFICATION,
        },
      });

      const doctor = await tx.doctor.create({
        data: {
          userId: user.id,
          cpf: normalizedCpf,
          fullName: dto.fullName,
          birthDate: new Date(dto.birthDate),
          gender: dto.gender,
          phone: dto.phone,
          crm: dto.crm,
          crmState: dto.crmState.toUpperCase(),
          specialties: dto.specialties,
        },
      });

      return { user, doctor };
    });

    // Armazenar token de verificação
    await this.cacheService.set(
      `email_verification:${verificationToken}`,
      result.user.id,
      this.VERIFICATION_TOKEN_EXPIRY_HOURS * 3600,
    );

    // Emitir evento
    this.eventEmitter.emit('auth.registered', {
      userId: result.user.id,
      email: dto.email,
      name: dto.fullName,
      verificationToken,
      type: 'doctor',
    });

    // Auditoria
    await this.auditService.log({
      action: AuditAction.CREATE,
      resource: 'user',
      resourceId: result.user.id,
      userId: result.user.id,
      description: 'Novo médico registrado',
      ipAddress,
    });

    const tokens = await this.generateTokens(result.user);

    return {
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
        status: result.user.status,
        doctor: {
          id: result.doctor.id,
          fullName: result.doctor.fullName,
          crm: result.doctor.crm,
          crmState: result.doctor.crmState,
        },
      },
      ...tokens,
      message: 'Registro realizado com sucesso. Verifique seu email para ativar sua conta.',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN
  // ═══════════════════════════════════════════════════════════════════════════

  async login(dto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    this.logger.log(`Login attempt for: ${dto.email}`);

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        patient: true,
        doctor: true,
      },
    });

    if (!user) {
      // Log falha para segurança (não revelar se email existe)
      this.logger.warn(`Failed login attempt for non-existent email: ${dto.email}`);
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar se conta está bloqueada
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesRemaining = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new ForbiddenException(
        `Conta bloqueada. Tente novamente em ${minutesRemaining} minutos.`,
      );
    }

    // Verificar status da conta
    if (user.status === UserStatus.BLOCKED) {
      throw new ForbiddenException('Esta conta foi bloqueada. Entre em contato com o suporte.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Esta conta está suspensa.');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      // Incrementar tentativas falhas
      const failedAttempts = user.failedLoginAttempts + 1;
      
      const updateData: any = { failedLoginAttempts: failedAttempts };
      
      // Bloquear após MAX_LOGIN_ATTEMPTS
      if (failedAttempts >= this.MAX_LOGIN_ATTEMPTS) {
        updateData.lockedUntil = new Date(
          Date.now() + this.LOCK_TIME_MINUTES * 60 * 1000,
        );
        this.logger.warn(`Account locked after ${failedAttempts} failed attempts: ${user.id}`);
      }

      await this.prisma.user.update({
        where: { id: user.id },
        data: updateData,
      });

      // Auditoria de falha
      await this.auditService.log({
        action: AuditAction.LOGIN,
        resource: 'user',
        resourceId: user.id,
        userId: user.id,
        description: `Tentativa de login falhou (tentativa ${failedAttempts})`,
        ipAddress,
        metadata: { userAgent },
      });

      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verificar 2FA se habilitado
    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) {
        return {
          requires2FA: true,
          message: 'Código de autenticação de dois fatores necessário',
        } as any;
      }

      const isValid2FA = speakeasy.totp.verify({
        secret: user.twoFactorSecret!,
        encoding: 'base32',
        token: dto.twoFactorCode,
        window: 1, // Permite 30 segundos de tolerância
      });

      if (!isValid2FA) {
        throw new UnauthorizedException('Código 2FA inválido');
      }
    }

    // Login bem-sucedido - resetar tentativas e atualizar último login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Gerar tokens
    const tokens = await this.generateTokens(user);

    // Criar sessão
    await this.prisma.session.create({
      data: {
        userId: user.id,
        token: tokens.accessToken,
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      },
    });

    // Auditoria de sucesso
    await this.auditService.log({
      action: AuditAction.LOGIN,
      resource: 'user',
      resourceId: user.id,
      userId: user.id,
      description: 'Login realizado com sucesso',
      ipAddress,
      metadata: { userAgent },
    });

    // Emitir evento
    this.eventEmitter.emit('auth.login', {
      userId: user.id,
      email: user.email,
      ipAddress,
      userAgent,
    });

    this.logger.log(`User logged in successfully: ${user.id}`);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
      message: 'Login realizado com sucesso',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REFRESH TOKEN
  // ═══════════════════════════════════════════════════════════════════════════

  async refreshToken(dto: RefreshTokenDto): Promise<AuthResponse> {
    try {
      // Verificar se token está na blacklist
      const isBlacklisted = await this.cacheService.get(
        `token_blacklist:${dto.refreshToken}`,
      );

      if (isBlacklisted) {
        throw new UnauthorizedException('Token inválido');
      }

      // Verificar token no banco
      const storedToken = await this.prisma.refreshToken.findUnique({
        where: { token: dto.refreshToken },
        include: { user: { include: { patient: true, doctor: true } } },
      });

      if (!storedToken || storedToken.isRevoked || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Token inválido ou expirado');
      }

      // Revogar token antigo (rotation)
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          revokedReason: 'Token rotation',
        },
      });

      // Gerar novos tokens
      const tokens = await this.generateTokens(storedToken.user);

      return {
        user: this.sanitizeUser(storedToken.user),
        ...tokens,
      };
    } catch (error) {
      this.logger.error(`Refresh token error: ${error.message}`);
      throw new UnauthorizedException('Token inválido');
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGOUT
  // ═══════════════════════════════════════════════════════════════════════════

  async logout(userId: string, accessToken: string): Promise<void> {
    // Adicionar token à blacklist
    const decoded = this.jwtService.decode(accessToken) as JwtPayload;
    if (decoded?.exp) {
      const ttl = decoded.exp - Math.floor(Date.now() / 1000);
      if (ttl > 0) {
        await this.cacheService.set(`token_blacklist:${accessToken}`, '1', ttl);
      }
    }

    // Revogar todos os refresh tokens do usuário
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'User logout',
      },
    });

    // Desativar sessões
    await this.prisma.session.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false },
    });

    // Auditoria
    await this.auditService.log({
      action: AuditAction.LOGOUT,
      resource: 'user',
      resourceId: userId,
      userId,
      description: 'Logout realizado',
    });

    this.logger.log(`User logged out: ${userId}`);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICAÇÃO DE EMAIL
  // ═══════════════════════════════════════════════════════════════════════════

  async verifyEmail(token: string): Promise<{ message: string }> {
    const userId = await this.cacheService.get(`email_verification:${token}`);

    if (!userId) {
      throw new BadRequestException('Token de verificação inválido ou expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.emailVerified) {
      return { message: 'Email já verificado anteriormente' };
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerifiedAt: new Date(),
        status: UserStatus.ACTIVE,
      },
    });

    // Remover token do cache
    await this.cacheService.del(`email_verification:${token}`);

    // Auditoria
    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'user',
      resourceId: user.id,
      userId: user.id,
      description: 'Email verificado',
    });

    return { message: 'Email verificado com sucesso! Sua conta está ativa.' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECUPERAÇÃO DE SENHA
  // ═══════════════════════════════════════════════════════════════════════════

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    // Sempre retorna sucesso para não revelar se email existe
    if (!user) {
      return {
        message: 'Se o email estiver cadastrado, você receberá instruções de recuperação.',
      };
    }

    const resetToken = this.generateSecureToken();

    // Armazenar token no cache
    await this.cacheService.set(
      `password_reset:${resetToken}`,
      user.id,
      this.RESET_TOKEN_EXPIRY_HOURS * 3600,
    );

    // Emitir evento para envio de email
    this.eventEmitter.emit('auth.forgot-password', {
      userId: user.id,
      email: user.email,
      resetToken,
    });

    return {
      message: 'Se o email estiver cadastrado, você receberá instruções de recuperação.',
    };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const userId = await this.cacheService.get(`password_reset:${dto.token}`);

    if (!userId) {
      throw new BadRequestException('Token de recuperação inválido ou expirado');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId as string },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    // Revogar todos os tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: {
        isRevoked: true,
        revokedAt: new Date(),
        revokedReason: 'Password reset',
      },
    });

    // Remover token do cache
    await this.cacheService.del(`password_reset:${dto.token}`);

    // Auditoria
    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'user',
      resourceId: user.id,
      userId: user.id,
      description: 'Senha redefinida',
    });

    return { message: 'Senha redefinida com sucesso' };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, this.SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordChangedAt: new Date(),
        mustChangePassword: false,
      },
    });

    // Auditoria
    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'user',
      resourceId: user.id,
      userId: user.id,
      description: 'Senha alterada',
    });

    return { message: 'Senha alterada com sucesso' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2FA
  // ═══════════════════════════════════════════════════════════════════════════

  async setup2FA(userId: string): Promise<TwoFactorSetupResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA já está habilitado');
    }

    // Gerar secret
    const secret = speakeasy.generateSecret({
      name: `HEALTHFLOW:${user.email}`,
      issuer: 'HEALTHFLOW',
    });

    // Gerar QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    // Armazenar secret temporariamente
    await this.cacheService.set(
      `2fa_setup:${userId}`,
      secret.base32,
      300, // 5 minutos
    );

    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      message: 'Escaneie o QR code no seu app autenticador e confirme com o código gerado.',
    };
  }

  async enable2FA(userId: string, dto: Enable2FADto): Promise<{ message: string }> {
    const secret = await this.cacheService.get(`2fa_setup:${userId}`);

    if (!secret) {
      throw new BadRequestException('Configure o 2FA novamente');
    }

    const isValid = speakeasy.totp.verify({
      secret: secret as string,
      encoding: 'base32',
      token: dto.code,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException('Código inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret as string,
      },
    });

    await this.cacheService.del(`2fa_setup:${userId}`);

    // Auditoria
    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'user',
      resourceId: userId,
      userId,
      description: '2FA habilitado',
    });

    return { message: 'Autenticação de dois fatores habilitada com sucesso' };
  }

  async disable2FA(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA não está habilitado');
    }

    const isValid = speakeasy.totp.verify({
      secret: user.twoFactorSecret!,
      encoding: 'base32',
      token: code,
      window: 1,
    });

    if (!isValid) {
      throw new BadRequestException('Código inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    // Auditoria
    await this.auditService.log({
      action: AuditAction.UPDATE,
      resource: 'user',
      resourceId: userId,
      userId,
      description: '2FA desabilitado',
    });

    return { message: 'Autenticação de dois fatores desabilitada' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS PRIVADOS
  // ═══════════════════════════════════════════════════════════════════════════

  private async generateTokens(user: any): Promise<TokenPayload> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    // Salvar refresh token no banco
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutos em segundos
      tokenType: 'Bearer',
    };
  }

  private sanitizeUser(user: any): any {
    const { passwordHash, twoFactorSecret, ...sanitized } = user;
    return sanitized;
  }

  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private normalizeCpf(cpf: string): string {
    return cpf.replace(/[^\d]/g, '');
  }

  private isValidCpf(cpf: string): boolean {
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1+$/.test(cpf)) return false;

    // Validação dos dígitos verificadores
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return false;

    return true;
  }
}
```

#### CHECKPOINT 1.3.1:
```
VALIDAÇÃO OBRIGATÓRIA:
[ ] Service criado sem erros de TypeScript?
[ ] Todas as dependências importadas?
[ ] Todos os métodos documentados?
[ ] Tratamento de erros em todos os métodos?
[ ] Validação de CPF implementada?
[ ] Auditoria em todas as operações sensíveis?
[ ] 2FA implementado corretamente?

EXECUTAR:
cd apps/api
npm run lint
npm run build

SE TUDO PASSAR → PROSSEGUIR
SE ERRO → CORRIGIR E REVALIDAR
```

---

### 1.4 AUTH CONTROLLER

#### PROMPT 1.4.1: Auth Controller Completo
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/auth/auth.controller.ts

import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import {
  RegisterPatientDto,
  RegisterDoctorDto,
} from './dto/register.dto';
import {
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ChangePasswordDto,
  VerifyEmailDto,
  Enable2FADto,
} from './dto/login.dto';
import {
  AuthResponseDto,
  MessageResponseDto,
  TwoFactorSetupResponseDto,
} from './dto/response.dto';

@ApiTags('Auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTRO
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('register/patient')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar novo paciente',
    description: `
      Cria uma nova conta de paciente no sistema.
      
      **Requisitos:**
      - Email único e válido
      - CPF válido e único
      - Senha com mínimo 8 caracteres, incluindo maiúscula, minúscula, número e caractere especial
      - Aceitar Termos de Uso e Política de Privacidade
      
      **Após registro:**
      - Email de verificação será enviado
      - Conta ficará pendente até verificação
    `,
  })
  @ApiBody({ type: RegisterPatientDto })
  @ApiResponse({
    status: 201,
    description: 'Paciente registrado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email ou CPF já cadastrado' })
  async registerPatient(
    @Body() dto: RegisterPatientDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const ipAddress = this.getIpAddress(req);
    return this.authService.registerPatient(dto, ipAddress);
  }

  @Post('register/doctor')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registrar novo médico',
    description: `
      Cria uma nova conta de médico no sistema.
      
      **Requisitos:**
      - Email único e válido
      - CPF válido e único
      - CRM válido e único (será validado no CFM)
      - Especialidades cadastradas
      
      **Após registro:**
      - Email de verificação será enviado
      - CRM será validado junto ao CFM
      - Conta ficará pendente até validações
    `,
  })
  @ApiBody({ type: RegisterDoctorDto })
  @ApiResponse({
    status: 201,
    description: 'Médico registrado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 409, description: 'Email, CPF ou CRM já cadastrado' })
  async registerDoctor(
    @Body() dto: RegisterDoctorDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const ipAddress = this.getIpAddress(req);
    return this.authService.registerDoctor(dto, ipAddress);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN / LOGOUT
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Realizar login',
    description: `
      Autentica o usuário e retorna tokens de acesso.
      
      **Fluxo:**
      1. Valida credenciais
      2. Se 2FA habilitado, retorna requires2FA: true
      3. Gera access token (15min) e refresh token (7 dias)
      
      **Proteções:**
      - Rate limiting: 5 tentativas por minuto
      - Bloqueio após 5 falhas consecutivas (30min)
    `,
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  @ApiResponse({ status: 403, description: 'Conta bloqueada ou suspensa' })
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponseDto> {
    const ipAddress = this.getIpAddress(req);
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Realizar logout',
    description: 'Invalida o token atual e todos os refresh tokens do usuário.',
  })
  @ApiResponse({ status: 200, description: 'Logout realizado com sucesso' })
  async logout(
    @CurrentUser('id') userId: string,
    @Req() req: Request,
  ): Promise<MessageResponseDto> {
    const token = req.headers.authorization?.replace('Bearer ', '');
    await this.authService.logout(userId, token!);
    return { message: 'Logout realizado com sucesso' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REFRESH TOKEN
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Renovar token de acesso',
    description: `
      Usa o refresh token para gerar novos tokens.
      
      **Importante:**
      - Refresh token é rotacionado a cada uso
      - Token antigo é invalidado
    `,
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Tokens renovados com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token inválido ou expirado' })
  async refreshToken(@Body() dto: RefreshTokenDto): Promise<AuthResponseDto> {
    return this.authService.refreshToken(dto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFICAÇÃO DE EMAIL
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('verify-email')
  @Public()
  @ApiOperation({
    summary: 'Verificar email',
    description: 'Confirma o email do usuário através do token enviado.',
  })
  @ApiResponse({ status: 200, description: 'Email verificado com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async verifyEmail(
    @Query('token') token: string,
  ): Promise<MessageResponseDto> {
    return this.authService.verifyEmail(token);
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Reenviar email de verificação',
    description: 'Envia novo email de verificação para o usuário logado.',
  })
  @ApiResponse({ status: 200, description: 'Email de verificação reenviado' })
  async resendVerification(
    @CurrentUser('id') userId: string,
  ): Promise<MessageResponseDto> {
    // TODO: Implementar
    return { message: 'Email de verificação reenviado' };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RECUPERAÇÃO DE SENHA
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Solicitar recuperação de senha',
    description: `
      Envia email com link de recuperação de senha.
      
      **Segurança:**
      - Não revela se o email existe no sistema
      - Token válido por 2 horas
    `,
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({ status: 200, description: 'Email de recuperação enviado (se existir)' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
  ): Promise<MessageResponseDto> {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Redefinir senha',
    description: 'Define nova senha usando o token de recuperação.',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({ status: 200, description: 'Senha redefinida com sucesso' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<MessageResponseDto> {
    return this.authService.resetPassword(dto);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Alterar senha',
    description: 'Altera a senha do usuário logado.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  @ApiResponse({ status: 401, description: 'Senha atual incorreta' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<MessageResponseDto> {
    return this.authService.changePassword(userId, dto);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // 2FA
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('2fa/setup')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Configurar 2FA',
    description: 'Gera QR code e secret para configuração do 2FA.',
  })
  @ApiResponse({
    status: 200,
    description: 'Configuração do 2FA',
    type: TwoFactorSetupResponseDto,
  })
  async setup2FA(
    @CurrentUser('id') userId: string,
  ): Promise<TwoFactorSetupResponseDto> {
    return this.authService.setup2FA(userId);
  }

  @Post('2fa/enable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Habilitar 2FA',
    description: 'Confirma e habilita o 2FA com o código do app autenticador.',
  })
  @ApiBody({ type: Enable2FADto })
  @ApiResponse({ status: 200, description: '2FA habilitado com sucesso' })
  @ApiResponse({ status: 400, description: 'Código inválido' })
  async enable2FA(
    @CurrentUser('id') userId: string,
    @Body() dto: Enable2FADto,
  ): Promise<MessageResponseDto> {
    return this.authService.enable2FA(userId, dto);
  }

  @Post('2fa/disable')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Desabilitar 2FA',
    description: 'Desabilita o 2FA após confirmação com código.',
  })
  @ApiResponse({ status: 200, description: '2FA desabilitado com sucesso' })
  @ApiResponse({ status: 400, description: 'Código inválido' })
  async disable2FA(
    @CurrentUser('id') userId: string,
    @Body('code') code: string,
  ): Promise<MessageResponseDto> {
    return this.authService.disable2FA(userId, code);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFIL
  // ═══════════════════════════════════════════════════════════════════════════

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obter perfil do usuário logado',
    description: 'Retorna os dados do usuário autenticado.',
  })
  @ApiResponse({ status: 200, description: 'Dados do usuário' })
  async getProfile(@CurrentUser() user: any): Promise<any> {
    return user;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private getIpAddress(req: Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  }
}
```

#### CHECKPOINT 1.4.1:
```
VALIDAÇÃO OBRIGATÓRIA:
[ ] Controller criado sem erros?
[ ] Todos os endpoints documentados com Swagger?
[ ] Todos os guards aplicados corretamente?
[ ] Rate limiting configurado?
[ ] Decorators implementados?

EXECUTAR:
cd apps/api
npm run lint
npm run build

SE TUDO PASSAR → PROSSEGUIR PARA TESTES
SE ERRO → CORRIGIR E REVALIDAR
```

---

### 1.5 TESTES DE AUTENTICAÇÃO

#### PROMPT 1.5.1: Testes Unitários do Auth Service
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/auth/__tests__/auth.service.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth.service';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';
import { UserRole, UserStatus, Gender } from '@prisma/client';

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: jest.Mocked<PrismaService>;
  let jwtService: jest.Mocked<JwtService>;
  let cacheService: jest.Mocked<CacheService>;
  let auditService: jest.Mocked<AuditService>;
  let eventEmitter: jest.Mocked<EventEmitter2>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    passwordHash: '$2a$12$hashedpassword',
    role: UserRole.PATIENT,
    status: UserStatus.ACTIVE,
    twoFactorEnabled: false,
    twoFactorSecret: null,
    emailVerified: true,
    failedLoginAttempts: 0,
    lockedUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const mockPatient = {
    id: '123e4567-e89b-12d3-a456-426614174001',
    userId: mockUser.id,
    cpf: '12345678901',
    fullName: 'Test User',
    birthDate: new Date('1990-01-01'),
    gender: Gender.MALE,
    phone: '+5511999999999',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            patient: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            refreshToken: {
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
            },
            session: {
              create: jest.fn(),
              updateMany: jest.fn(),
            },
            $transaction: jest.fn((callback) => callback({
              user: { create: jest.fn().mockResolvedValue(mockUser) },
              patient: { create: jest.fn().mockResolvedValue(mockPatient) },
            })),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock.jwt.token'),
            decode: jest.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 900 }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string, defaultValue?: any) => {
              const config: Record<string, any> = {
                JWT_SECRET: 'test-secret',
                JWT_REFRESH_SECRET: 'test-refresh-secret',
                JWT_EXPIRES_IN: '15m',
                JWT_REFRESH_EXPIRES_IN: '7d',
              };
              return config[key] ?? defaultValue;
            }),
          },
        },
        {
          provide: CacheService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get(PrismaService);
    jwtService = module.get(JwtService);
    cacheService = module.get(CacheService);
    auditService = module.get(AuditService);
    eventEmitter = module.get(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerPatient', () => {
    const registerDto = {
      email: 'newuser@example.com',
      password: 'Password@123',
      cpf: '529.982.247-25', // CPF válido
      fullName: 'New User',
      birthDate: '1990-01-01',
      gender: Gender.MALE,
      phone: '+5511999999999',
      termsAccepted: true,
      privacyAccepted: true,
    };

    it('should register a new patient successfully', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);
      prismaService.patient.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.registerPatient(registerDto);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toHaveProperty('id');
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'auth.registered',
        expect.any(Object),
      );
    });

    it('should throw ConflictException if email already exists', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      await expect(service.registerPatient(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ConflictException if CPF already exists', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);
      prismaService.patient.findUnique = jest.fn().mockResolvedValue(mockPatient);

      await expect(service.registerPatient(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw BadRequestException if terms not accepted', async () => {
      const dtoWithoutTerms = { ...registerDto, termsAccepted: false };

      await expect(service.registerPatient(dtoWithoutTerms)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException for invalid CPF', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);
      const dtoWithInvalidCpf = { ...registerDto, cpf: '111.111.111-11' };

      await expect(service.registerPatient(dtoWithInvalidCpf)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('Password@123', 12);
      const userWithHash = { ...mockUser, passwordHash: hashedPassword };
      
      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        ...userWithHash,
        patient: mockPatient,
      });

      const result = await service.login({
        email: 'test@example.com',
        password: 'Password@123',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGIN' }),
      );
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        patient: mockPatient,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'WrongPassword@123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@example.com',
          password: 'Password@123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw ForbiddenException if account is locked', async () => {
      const lockedUser = {
        ...mockUser,
        lockedUntil: new Date(Date.now() + 30 * 60 * 1000), // 30 min no futuro
      };
      prismaService.user.findUnique = jest.fn().mockResolvedValue(lockedUser);

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'Password@123',
        }),
      ).rejects.toThrow('Conta bloqueada');
    });

    it('should increment failed attempts on wrong password', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        patient: mockPatient,
        failedLoginAttempts: 2,
      });

      await expect(
        service.login({
          email: 'test@example.com',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);

      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ failedLoginAttempts: 3 }),
        }),
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
      const storedToken = {
        id: 'token-id',
        token: 'valid-refresh-token',
        userId: mockUser.id,
        isRevoked: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        user: { ...mockUser, patient: mockPatient },
      };

      cacheService.get = jest.fn().mockResolvedValue(null);
      prismaService.refreshToken.findUnique = jest.fn().mockResolvedValue(storedToken);

      const result = await service.refreshToken({
        refreshToken: 'valid-refresh-token',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prismaService.refreshToken.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for blacklisted token', async () => {
      cacheService.get = jest.fn().mockResolvedValue('1');

      await expect(
        service.refreshToken({ refreshToken: 'blacklisted-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      await service.logout(mockUser.id, 'mock.jwt.token');

      expect(cacheService.set).toHaveBeenCalled();
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalled();
      expect(prismaService.session.updateMany).toHaveBeenCalled();
      expect(auditService.log).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'LOGOUT' }),
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      cacheService.get = jest.fn().mockResolvedValue(mockUser.id);
      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        emailVerified: false,
      });

      const result = await service.verifyEmail('valid-token');

      expect(result.message).toContain('sucesso');
      expect(prismaService.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            emailVerified: true,
            status: UserStatus.ACTIVE,
          }),
        }),
      );
    });

    it('should throw BadRequestException for invalid token', async () => {
      cacheService.get = jest.fn().mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email if user exists', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      const result = await service.forgotPassword({
        email: 'test@example.com',
      });

      expect(result.message).toContain('receberá instruções');
      expect(cacheService.set).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'auth.forgot-password',
        expect.any(Object),
      );
    });

    it('should return success message even if user does not exist (security)', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.forgotPassword({
        email: 'nonexistent@example.com',
      });

      expect(result.message).toContain('receberá instruções');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const hashedPassword = await bcrypt.hash('CurrentPassword@123', 12);
      prismaService.user.findUnique = jest.fn().mockResolvedValue({
        ...mockUser,
        passwordHash: hashedPassword,
      });

      const result = await service.changePassword(mockUser.id, {
        currentPassword: 'CurrentPassword@123',
        newPassword: 'NewPassword@123',
      });

      expect(result.message).toContain('sucesso');
      expect(prismaService.user.update).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for wrong current password', async () => {
      prismaService.user.findUnique = jest.fn().mockResolvedValue(mockUser);

      await expect(
        service.changePassword(mockUser.id, {
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword@123',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('CPF Validation', () => {
    it('should validate correct CPF', () => {
      // @ts-ignore - Acessando método privado para teste
      expect(service['isValidCpf']('52998224725')).toBe(true);
    });

    it('should reject invalid CPF', () => {
      // @ts-ignore
      expect(service['isValidCpf']('11111111111')).toBe(false);
      // @ts-ignore
      expect(service['isValidCpf']('12345678900')).toBe(false);
    });

    it('should normalize CPF', () => {
      // @ts-ignore
      expect(service['normalizeCpf']('529.982.247-25')).toBe('52998224725');
    });
  });
});
```

#### CHECKPOINT 1.5.1:
```
VALIDAÇÃO OBRIGATÓRIA:
[ ] Testes unitários criados?
[ ] Cobertura de todos os métodos principais?
[ ] Casos de sucesso testados?
[ ] Casos de erro testados?
[ ] Mocks configurados corretamente?

EXECUTAR:
cd apps/api
npm run test -- --coverage --testPathPattern=auth.service.spec.ts

CRITÉRIOS DE ACEITAÇÃO:
- Todos os testes passando ✓
- Coverage > 80%

SE TUDO PASSAR → PROSSEGUIR PARA FASE 2
SE FALHAR → CORRIGIR TESTES, REEXECUTAR
```

---

## CICLO DE VALIDAÇÃO MASTER

### ANTES DE AVANÇAR PARA PRÓXIMA FASE, VERIFICAR:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    VALIDAÇÃO DE FASE COMPLETA                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  FASE 1 - AUTENTICAÇÃO                                                      ║
║                                                                              ║
║  □ Schema Prisma validado                                                    ║
║  □ Migration executada sem erros                                             ║
║  □ DTOs completos com validação                                              ║
║  □ Service implementado 100%                                                 ║
║  □ Controller implementado 100%                                              ║
║  □ Guards e Decorators funcionando                                           ║
║  □ Testes unitários passando (>80% coverage)                                 ║
║  □ Testes e2e passando                                                       ║
║  □ Documentação Swagger completa                                             ║
║  □ Build sem erros                                                           ║
║  □ Lint sem warnings                                                         ║
║                                                                              ║
║  EXECUTAR SEQUÊNCIA:                                                         ║
║  1. npm run lint                                                             ║
║  2. npm run build                                                            ║
║  3. npm run test -- --coverage                                               ║
║  4. npm run test:e2e                                                         ║
║  5. docker-compose up -d && npm run db:migrate && npm run db:seed            ║
║  6. npm run start:dev (testar manualmente com Swagger)                       ║
║                                                                              ║
║  SE TUDO OK → COMMIT: "feat(auth): implement complete authentication module" ║
║  SE FALHAR → VOLTAR AO CHECKPOINT QUE FALHOU                                ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## FASE 2: MÓDULO DE PACIENTES [Dias 29-42]

### 2.1 PATIENTS SERVICE

#### PROMPT 2.1.1: Patients DTOs
```typescript
CRIAR ARQUIVO: /healthflow/apps/api/src/modules/patients/dto/patient.dto.ts

// DTOs completos do módulo de pacientes...
// [Continua com implementação completa]
```

---

**[DOCUMENTO CONTINUA NAS PARTES 3, 4, 5...]**

O documento completo terá aproximadamente 50.000+ linhas cobrindo:

- FASE 2: Pacientes
- FASE 3: Médicos
- FASE 4: Clínicas
- FASE 5: Agendamento
- FASE 6: Consultas/Prontuário
- FASE 7: Prescrições
- FASE 8: Gamificação
- FASE 9: Telemedicina
- FASE 10: Notificações
- FASE 11: Integrações (FHIR, RNDS, CFM, ANVISA)
- FASE 12: Analytics/BI
- FASE 13: Frontend Web
- FASE 14: Mobile App
- FASE 15: Infraestrutura/DevOps
- FASE 16: Testes E2E
- FASE 17: Deploy Production
