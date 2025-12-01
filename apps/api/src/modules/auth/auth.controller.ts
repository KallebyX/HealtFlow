import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Param,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Delete,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
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
  Disable2FADto,
} from './dto/login.dto';
import {
  AuthResponseDto,
  MessageResponseDto,
  TwoFactorSetupResponseDto,
  SessionsResponseDto,
} from './dto/response.dto';
import { UserRole } from '@prisma/client';

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
    return this.authService.registerPatient(dto, ipAddress) as any;
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
    return this.authService.registerDoctor(dto, ipAddress) as any;
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
    return this.authService.login(dto, ipAddress, userAgent) as any;
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
    @CurrentUser('sub') userId: string,
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
    return this.authService.refreshToken(dto) as any;
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
  @ApiQuery({ name: 'token', required: true, description: 'Token de verificação' })
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
    @CurrentUser('sub') userId: string,
  ): Promise<MessageResponseDto> {
    return this.authService.resendVerificationEmail(userId);
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
    @CurrentUser('sub') userId: string,
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
    @CurrentUser('sub') userId: string,
  ): Promise<TwoFactorSetupResponseDto> {
    return this.authService.setup2FA(userId) as any;
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
    @CurrentUser('sub') userId: string,
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
  @ApiBody({ type: Disable2FADto })
  @ApiResponse({ status: 200, description: '2FA desabilitado com sucesso' })
  @ApiResponse({ status: 400, description: 'Código inválido' })
  async disable2FA(
    @CurrentUser('sub') userId: string,
    @Body() dto: Disable2FADto,
  ): Promise<MessageResponseDto> {
    return this.authService.disable2FA(userId, dto.code);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PERFIL E SESSÕES
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

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Listar sessões ativas',
    description: 'Retorna todas as sessões ativas do usuário.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de sessões',
    type: SessionsResponseDto,
  })
  async getSessions(
    @CurrentUser('sub') userId: string,
  ): Promise<SessionsResponseDto> {
    return this.authService.getSessions(userId) as any;
  }

  @Delete('sessions/:sessionId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Revogar sessão específica',
    description: 'Revoga uma sessão específica do usuário.',
  })
  @ApiResponse({ status: 200, description: 'Sessão revogada' })
  @ApiResponse({ status: 404, description: 'Sessão não encontrada' })
  async revokeSession(
    @CurrentUser('sub') userId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<MessageResponseDto> {
    return this.authService.revokeSession(userId, sessionId);
  }

  @Delete('sessions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Revogar todas as outras sessões',
    description: 'Revoga todas as sessões exceto a atual.',
  })
  @ApiResponse({ status: 200, description: 'Sessões revogadas' })
  async revokeAllSessions(
    @CurrentUser('sub') userId: string,
  ): Promise<MessageResponseDto> {
    return this.authService.revokeAllSessions(userId);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ADMIN ONLY
  // ═══════════════════════════════════════════════════════════════════════════

  @Post('admin/block-user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Bloquear usuário (Admin)',
    description: 'Bloqueia um usuário impedindo login.',
  })
  @ApiResponse({ status: 200, description: 'Usuário bloqueado' })
  async blockUser(
    @Param('userId') userId: string,
  ): Promise<MessageResponseDto> {
    // TODO: Implementar bloqueio de usuário
    return { message: `Usuário ${userId} bloqueado` };
  }

  @Post('admin/unblock-user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.CLINIC_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Desbloquear usuário (Admin)',
    description: 'Desbloqueia um usuário permitindo login.',
  })
  @ApiResponse({ status: 200, description: 'Usuário desbloqueado' })
  async unblockUser(
    @Param('userId') userId: string,
  ): Promise<MessageResponseDto> {
    // TODO: Implementar desbloqueio de usuário
    return { message: `Usuário ${userId} desbloqueado` };
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
