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
import { authenticator } from 'otplib';
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
  UserInfo,
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
  ) {
    // Configurar otplib
    authenticator.options = {
      window: 1,
    };
  }

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
          emailVerificationToken: verificationToken,
          emailVerificationExpires: new Date(
            Date.now() + this.VERIFICATION_TOKEN_EXPIRY_HOURS * 3600 * 1000,
          ),
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
          secondaryPhone: dto.phoneSecondary,
          height: dto.height,
          weight: dto.weight,
          address: dto.address as any,
          emergencyContact: dto.emergencyContact as any,
          allergies: dto.allergies || [],
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
          socialName: result.patient.socialName || undefined,
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

    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);
    const verificationToken = this.generateSecureToken();

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email.toLowerCase(),
          passwordHash,
          role: UserRole.DOCTOR,
          status: UserStatus.PENDING_VERIFICATION,
          emailVerificationToken: verificationToken,
          emailVerificationExpires: new Date(
            Date.now() + this.VERIFICATION_TOKEN_EXPIRY_HOURS * 3600 * 1000,
          ),
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
          rqe: dto.rqe || [],
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
        employee: true,
      },
    });

    if (!user) {
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
    if (user.status === UserStatus.INACTIVE) {
      throw new ForbiddenException('Esta conta foi desativada. Entre em contato com o suporte.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new ForbiddenException('Esta conta está suspensa.');
    }

    // Verificar senha
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      // Incrementar tentativas falhas
      const failedAttempts = (user.loginAttempts || 0) + 1;

      const updateData: any = { loginAttempts: failedAttempts };

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
        metadata: { userAgent, success: false },
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

      const isValid2FA = authenticator.verify({
        token: dto.twoFactorCode,
        secret: user.twoFactorSecret!,
      });

      if (!isValid2FA) {
        throw new UnauthorizedException('Código 2FA inválido');
      }
    }

    // Login bem-sucedido - resetar tentativas e atualizar último login
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        loginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    // Gerar tokens
    const tokens = await this.generateTokens(user);

    // Criar sessão
    await this.prisma.userSession.create({
      data: {
        userId: user.id,
        token: tokens.accessToken.substring(0, 50),
        userAgent,
        ipAddress,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
      metadata: { userAgent, success: true },
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
        include: {
          user: {
            include: {
              patient: true,
              doctor: true,
              employee: true,
            },
          },
        },
      });

      if (!storedToken || storedToken.revokedAt || storedToken.expiresAt < new Date()) {
        throw new UnauthorizedException('Token inválido ou expirado');
      }

      // Revogar token antigo (rotation)
      await this.prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: {
          revokedAt: new Date(),
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
      where: { userId, revokedAt: null },
      data: {
        revokedAt: new Date(),
      },
    });

    // Desativar sessões
    await this.prisma.userSession.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
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
        status: UserStatus.ACTIVE,
        emailVerificationToken: null,
        emailVerificationExpires: null,
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

    // Emitir evento
    this.eventEmitter.emit('auth.email-verified', {
      userId: user.id,
      email: user.email,
    });

    return { message: 'Email verificado com sucesso! Sua conta está ativa.' };
  }

  async resendVerificationEmail(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { patient: true, doctor: true },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (user.emailVerified) {
      return { message: 'Email já verificado' };
    }

    const verificationToken = this.generateSecureToken();

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(
          Date.now() + this.VERIFICATION_TOKEN_EXPIRY_HOURS * 3600 * 1000,
        ),
      },
    });

    await this.cacheService.set(
      `email_verification:${verificationToken}`,
      user.id,
      this.VERIFICATION_TOKEN_EXPIRY_HOURS * 3600,
    );

    const name = user.patient?.fullName || user.doctor?.fullName || user.email;

    this.eventEmitter.emit('auth.resend-verification', {
      userId: user.id,
      email: user.email,
      name,
      verificationToken,
    });

    return { message: 'Email de verificação reenviado' };
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(
          Date.now() + this.RESET_TOKEN_EXPIRY_HOURS * 3600 * 1000,
        ),
      },
    });

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
        loginAttempts: 0,
        lockedUntil: null,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Revogar todos os tokens
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: {
        revokedAt: new Date(),
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

    // Emitir evento
    this.eventEmitter.emit('auth.password-reset', {
      userId: user.id,
      email: user.email,
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
    const secret = authenticator.generateSecret();

    // Gerar URI para QR code
    const otpauthUrl = authenticator.keyuri(
      user.email,
      'HEALTHFLOW',
      secret,
    );

    // Gerar QR code
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);

    // Armazenar secret temporariamente
    await this.cacheService.set(
      `2fa_setup:${userId}`,
      secret,
      300, // 5 minutos
    );

    return {
      secret,
      qrCode: qrCodeUrl,
      message: 'Escaneie o QR code no seu app autenticador e confirme com o código gerado.',
    };
  }

  async enable2FA(userId: string, dto: Enable2FADto): Promise<{ message: string }> {
    const secret = await this.cacheService.get(`2fa_setup:${userId}`);

    if (!secret) {
      throw new BadRequestException('Configure o 2FA novamente');
    }

    const isValid = authenticator.verify({
      token: dto.code,
      secret: secret as string,
    });

    if (!isValid) {
      throw new BadRequestException('Código inválido');
    }

    // Gerar códigos de backup
    const backupCodes = Array.from({ length: 10 }, () =>
      crypto.randomBytes(4).toString('hex').toUpperCase(),
    );

    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10)),
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: true,
        twoFactorSecret: secret as string,
        twoFactorBackupCodes: hashedBackupCodes,
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

    return {
      message: 'Autenticação de dois fatores habilitada com sucesso',
    };
  }

  async disable2FA(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.twoFactorEnabled) {
      throw new BadRequestException('2FA não está habilitado');
    }

    const isValid = authenticator.verify({
      token: code,
      secret: user.twoFactorSecret!,
    });

    if (!isValid) {
      throw new BadRequestException('Código inválido');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorBackupCodes: [],
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
  // SESSÕES
  // ═══════════════════════════════════════════════════════════════════════════

  async getSessions(userId: string) {
    const sessions = await this.prisma.userSession.findMany({
      where: {
        userId,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { lastActivity: 'desc' },
    });

    return {
      sessions: sessions.map((s) => ({
        id: s.id,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        deviceInfo: s.deviceInfo,
        createdAt: s.createdAt,
        lastActivity: s.lastActivity,
      })),
      totalSessions: sessions.length,
    };
  }

  async revokeSession(userId: string, sessionId: string): Promise<{ message: string }> {
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Sessão não encontrada');
    }

    await this.prisma.userSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date() },
    });

    return { message: 'Sessão revogada com sucesso' };
  }

  async revokeAllSessions(userId: string, currentSessionId?: string): Promise<{ message: string }> {
    const where: any = { userId };

    if (currentSessionId) {
      where.id = { not: currentSessionId };
    }

    await this.prisma.userSession.updateMany({
      where,
      data: { revokedAt: new Date() },
    });

    return { message: 'Todas as sessões foram revogadas' };
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
      issuer: this.configService.get<string>('JWT_ISSUER', 'healthflow'),
      audience: this.configService.get<string>('JWT_AUDIENCE', 'healthflow-api'),
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

  private sanitizeUser(user: any): UserInfo {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      twoFactorEnabled: user.twoFactorEnabled,
      emailVerified: user.emailVerified,
      patient: user.patient
        ? {
            id: user.patient.id,
            fullName: user.patient.fullName,
            socialName: user.patient.socialName,
            level: user.patient.level,
            levelName: user.patient.levelName,
            totalPoints: user.patient.totalPoints,
          }
        : undefined,
      doctor: user.doctor
        ? {
            id: user.doctor.id,
            fullName: user.doctor.fullName,
            crm: user.doctor.crm,
            crmState: user.doctor.crmState,
            specialties: user.doctor.specialties,
            profilePhotoUrl: user.doctor.profilePhotoUrl,
            telemedicineEnabled: user.doctor.telemedicineEnabled,
          }
        : undefined,
      employee: user.employee
        ? {
            id: user.employee.id,
            fullName: user.employee.fullName,
            position: user.employee.position,
            department: user.employee.department,
          }
        : undefined,
    };
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
