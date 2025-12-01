import {
  IsString,
  IsUUID,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsNumber,
  Min,
  Max,
  IsDateString,
  MaxLength,
  IsNotEmpty,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ==================== Enums ====================

export enum AchievementCategory {
  HEALTH = 'HEALTH',
  ENGAGEMENT = 'ENGAGEMENT',
  APPOINTMENTS = 'APPOINTMENTS',
  MEDICATIONS = 'MEDICATIONS',
  EXAMS = 'EXAMS',
  TELEMEDICINE = 'TELEMEDICINE',
  SOCIAL = 'SOCIAL',
  STREAK = 'STREAK',
  MILESTONE = 'MILESTONE',
  SPECIAL = 'SPECIAL',
}

export enum AchievementRarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

export enum BadgeType {
  ACHIEVEMENT = 'ACHIEVEMENT',
  LEVEL = 'LEVEL',
  CHALLENGE = 'CHALLENGE',
  EVENT = 'EVENT',
  SEASONAL = 'SEASONAL',
}

export enum ChallengeType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  SPECIAL = 'SPECIAL',
  COMMUNITY = 'COMMUNITY',
}

export enum ChallengeStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export enum RewardType {
  POINTS = 'POINTS',
  BADGE = 'BADGE',
  DISCOUNT = 'DISCOUNT',
  FREE_SERVICE = 'FREE_SERVICE',
  PRIORITY = 'PRIORITY',
  CUSTOM = 'CUSTOM',
}

export enum LeaderboardPeriod {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  ALL_TIME = 'ALL_TIME',
}

export enum PointsActionType {
  // Ações de Saúde
  APPOINTMENT_COMPLETED = 'APPOINTMENT_COMPLETED',
  APPOINTMENT_ON_TIME = 'APPOINTMENT_ON_TIME',
  MEDICATION_TAKEN = 'MEDICATION_TAKEN',
  EXAM_COMPLETED = 'EXAM_COMPLETED',
  HEALTH_DATA_LOGGED = 'HEALTH_DATA_LOGGED',
  TELEMEDICINE_SESSION = 'TELEMEDICINE_SESSION',

  // Ações de Engajamento
  PROFILE_COMPLETED = 'PROFILE_COMPLETED',
  FIRST_LOGIN = 'FIRST_LOGIN',
  DAILY_LOGIN = 'DAILY_LOGIN',
  STREAK_BONUS = 'STREAK_BONUS',
  APP_RATED = 'APP_RATED',
  REFERRAL_MADE = 'REFERRAL_MADE',
  FEEDBACK_GIVEN = 'FEEDBACK_GIVEN',

  // Ações Sociais
  SHARED_ACHIEVEMENT = 'SHARED_ACHIEVEMENT',
  INVITED_FRIEND = 'INVITED_FRIEND',
  CHALLENGE_COMPLETED = 'CHALLENGE_COMPLETED',

  // Outras
  BONUS = 'BONUS',
  ADMIN_GRANT = 'ADMIN_GRANT',
  DEDUCTION = 'DEDUCTION',
  REDEMPTION = 'REDEMPTION',
}

// ==================== DTOs de Achievement ====================

export class CreateAchievementDto {
  @ApiProperty({ description: 'Código único do achievement' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Nome do achievement' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Descrição do achievement' })
  @IsString()
  @MaxLength(500)
  description: string;

  @ApiProperty({ enum: AchievementCategory })
  @IsEnum(AchievementCategory)
  category: AchievementCategory;

  @ApiProperty({ enum: AchievementRarity })
  @IsEnum(AchievementRarity)
  rarity: AchievementRarity;

  @ApiProperty({ description: 'Pontos ganhos ao completar' })
  @IsNumber()
  @Min(0)
  points: number;

  @ApiPropertyOptional({ description: 'URL do ícone/badge' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  iconUrl?: string;

  @ApiPropertyOptional({ description: 'Critérios para obter (JSON)' })
  @IsOptional()
  @IsObject()
  criteria?: Record<string, any>;

  @ApiPropertyOptional({ description: 'É oculto até ser desbloqueado' })
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @ApiPropertyOptional({ description: 'Está ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Ordem de exibição' })
  @IsOptional()
  @IsNumber()
  displayOrder?: number;

  @ApiPropertyOptional({ description: 'Pré-requisito: ID de outro achievement' })
  @IsOptional()
  @IsUUID()
  prerequisiteAchievementId?: string;
}

export class UpdateAchievementDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: AchievementCategory })
  @IsOptional()
  @IsEnum(AchievementCategory)
  category?: AchievementCategory;

  @ApiPropertyOptional({ enum: AchievementRarity })
  @IsOptional()
  @IsEnum(AchievementRarity)
  rarity?: AchievementRarity;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  points?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  iconUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  criteria?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isHidden?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  displayOrder?: number;
}

// ==================== DTOs de Challenge ====================

export class CreateChallengeDto {
  @ApiProperty({ description: 'Código único do desafio' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  code: string;

  @ApiProperty({ description: 'Nome do desafio' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Descrição do desafio' })
  @IsString()
  @MaxLength(1000)
  description: string;

  @ApiProperty({ enum: ChallengeType })
  @IsEnum(ChallengeType)
  type: ChallengeType;

  @ApiProperty({ description: 'Data de início' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Data de término' })
  @IsDateString()
  endDate: string;

  @ApiProperty({ description: 'Meta a ser atingida' })
  @IsNumber()
  @Min(1)
  goal: number;

  @ApiProperty({ description: 'Unidade da meta' })
  @IsString()
  @MaxLength(50)
  goalUnit: string;

  @ApiProperty({ description: 'Pontos de recompensa' })
  @IsNumber()
  @Min(0)
  rewardPoints: number;

  @ApiPropertyOptional({ description: 'Badge de recompensa' })
  @IsOptional()
  @IsUUID()
  rewardBadgeId?: string;

  @ApiPropertyOptional({ description: 'Critérios do desafio (JSON)' })
  @IsOptional()
  @IsObject()
  criteria?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Máximo de participantes' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxParticipants?: number;

  @ApiPropertyOptional({ description: 'URL do ícone' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  iconUrl?: string;

  @ApiPropertyOptional({ description: 'Cor do tema' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  themeColor?: string;

  @ApiPropertyOptional({ description: 'Está ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateChallengeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(1)
  goal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  rewardPoints?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class JoinChallengeDto {
  @ApiProperty({ description: 'ID do desafio' })
  @IsUUID()
  challengeId: string;
}

export class UpdateChallengeProgressDto {
  @ApiProperty({ description: 'ID do desafio' })
  @IsUUID()
  challengeId: string;

  @ApiProperty({ description: 'Progresso a adicionar' })
  @IsNumber()
  @Min(0)
  progress: number;

  @ApiPropertyOptional({ description: 'Metadados adicionais' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// ==================== DTOs de Pontos ====================

export class GrantPointsDto {
  @ApiProperty({ description: 'ID do usuário' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Quantidade de pontos' })
  @IsNumber()
  @Min(1)
  points: number;

  @ApiProperty({ enum: PointsActionType })
  @IsEnum(PointsActionType)
  actionType: PointsActionType;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ description: 'ID da entidade relacionada' })
  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @ApiPropertyOptional({ description: 'Tipo da entidade relacionada' })
  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @ApiPropertyOptional({ description: 'Metadados adicionais' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class DeductPointsDto {
  @ApiProperty({ description: 'ID do usuário' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Quantidade de pontos' })
  @IsNumber()
  @Min(1)
  points: number;

  @ApiProperty({ description: 'Motivo da dedução' })
  @IsString()
  @MaxLength(500)
  reason: string;

  @ApiPropertyOptional({ description: 'ID da entidade relacionada' })
  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @ApiPropertyOptional({ description: 'Tipo da entidade relacionada' })
  @IsOptional()
  @IsString()
  relatedEntityType?: string;
}

// ==================== DTOs de Reward ====================

export class CreateRewardDto {
  @ApiProperty({ description: 'Nome da recompensa' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: 'Descrição' })
  @IsString()
  @MaxLength(1000)
  description: string;

  @ApiProperty({ enum: RewardType })
  @IsEnum(RewardType)
  type: RewardType;

  @ApiProperty({ description: 'Custo em pontos' })
  @IsNumber()
  @Min(0)
  pointsCost: number;

  @ApiPropertyOptional({ description: 'Valor do desconto (se aplicável)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercentage?: number;

  @ApiPropertyOptional({ description: 'Valor fixo do desconto' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional({ description: 'Serviço gratuito (se aplicável)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  freeService?: string;

  @ApiPropertyOptional({ description: 'Quantidade disponível' })
  @IsOptional()
  @IsNumber()
  @Min(-1) // -1 para ilimitado
  quantity?: number;

  @ApiPropertyOptional({ description: 'Validade em dias após resgate' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  validityDays?: number;

  @ApiPropertyOptional({ description: 'Nível mínimo para resgatar' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  minLevel?: number;

  @ApiPropertyOptional({ description: 'URL da imagem' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string;

  @ApiPropertyOptional({ description: 'Termos e condições' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  terms?: string;

  @ApiPropertyOptional({ description: 'Está ativo' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'É destaque' })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ description: 'Categoria' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  category?: string;
}

export class UpdateRewardDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  pointsCost?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(-1)
  quantity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
}

export class RedeemRewardDto {
  @ApiProperty({ description: 'ID da recompensa' })
  @IsUUID()
  rewardId: string;

  @ApiPropertyOptional({ description: 'Código promocional' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  promoCode?: string;
}

// ==================== DTOs de Level ====================

export class CreateLevelDto {
  @ApiProperty({ description: 'Número do nível' })
  @IsNumber()
  @Min(1)
  level: number;

  @ApiProperty({ description: 'Nome do nível' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiPropertyOptional({ description: 'Descrição' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ description: 'Pontos necessários' })
  @IsNumber()
  @Min(0)
  pointsRequired: number;

  @ApiPropertyOptional({ description: 'URL do ícone' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  iconUrl?: string;

  @ApiPropertyOptional({ description: 'Cor do nível' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  color?: string;

  @ApiPropertyOptional({ description: 'Benefícios do nível' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  benefits?: string[];

  @ApiPropertyOptional({ description: 'Multiplicador de pontos' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  pointsMultiplier?: number;
}

// ==================== DTOs de Streak ====================

export class RecordStreakDto {
  @ApiProperty({ description: 'ID do usuário' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'Tipo de streak' })
  @IsEnum(['LOGIN', 'MEDICATION', 'EXERCISE', 'HEALTH_LOG', 'CUSTOM'])
  streakType: string;

  @ApiPropertyOptional({ description: 'Metadados' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// ==================== DTOs de Ação ====================

export class RecordActionDto {
  @ApiProperty({ enum: PointsActionType })
  @IsEnum(PointsActionType)
  actionType: PointsActionType;

  @ApiPropertyOptional({ description: 'ID da entidade relacionada' })
  @IsOptional()
  @IsString()
  relatedEntityId?: string;

  @ApiPropertyOptional({ description: 'Tipo da entidade' })
  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @ApiPropertyOptional({ description: 'Metadados' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

// ==================== DTOs de Referral ====================

export class CreateReferralCodeDto {
  @ApiPropertyOptional({ description: 'Código personalizado' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  customCode?: string;

  @ApiPropertyOptional({ description: 'Validade em dias' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  validityDays?: number;

  @ApiPropertyOptional({ description: 'Máximo de usos' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUses?: number;
}

export class UseReferralCodeDto {
  @ApiProperty({ description: 'Código de indicação' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  referralCode: string;
}

// ==================== DTOs de Notification ====================

export class AchievementNotificationDto {
  @ApiProperty({ description: 'ID do achievement' })
  @IsUUID()
  achievementId: string;

  @ApiProperty({ description: 'ID do usuário' })
  @IsUUID()
  userId: string;

  @ApiPropertyOptional({ description: 'Compartilhar em redes sociais' })
  @IsOptional()
  @IsBoolean()
  shareOnSocial?: boolean;
}
