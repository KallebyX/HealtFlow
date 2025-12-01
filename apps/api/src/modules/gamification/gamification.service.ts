import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { PrismaService } from '@/database/prisma.service';
import { CacheService } from '@/common/services/cache.service';
import { AuditService } from '@/common/services/audit.service';
import { UserRole } from '@/common/enums/user-role.enum';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

import {
  CreateAchievementDto,
  UpdateAchievementDto,
  CreateChallengeDto,
  UpdateChallengeDto,
  JoinChallengeDto,
  UpdateChallengeProgressDto,
  GrantPointsDto,
  DeductPointsDto,
  CreateRewardDto,
  UpdateRewardDto,
  RedeemRewardDto,
  CreateLevelDto,
  RecordStreakDto,
  RecordActionDto,
  CreateReferralCodeDto,
  UseReferralCodeDto,
  PointsActionType,
  ChallengeStatus,
  LeaderboardPeriod,
} from './dto/create-gamification.dto';
import {
  AchievementQueryDto,
  UserAchievementsQueryDto,
  ChallengeQueryDto,
  LeaderboardQueryDto,
  PointsHistoryQueryDto,
  RewardQueryDto,
  MyRedemptionsQueryDto,
  GamificationStatsQueryDto,
  StreakQueryDto,
} from './dto/gamification-query.dto';

@Injectable()
export class GamificationService {
  // Pontos base por ação
  private readonly POINTS_CONFIG: Record<PointsActionType, number> = {
    [PointsActionType.APPOINTMENT_COMPLETED]: 50,
    [PointsActionType.APPOINTMENT_ON_TIME]: 20,
    [PointsActionType.MEDICATION_TAKEN]: 10,
    [PointsActionType.EXAM_COMPLETED]: 30,
    [PointsActionType.HEALTH_DATA_LOGGED]: 5,
    [PointsActionType.TELEMEDICINE_SESSION]: 40,
    [PointsActionType.PROFILE_COMPLETED]: 100,
    [PointsActionType.FIRST_LOGIN]: 50,
    [PointsActionType.DAILY_LOGIN]: 5,
    [PointsActionType.STREAK_BONUS]: 0, // Calculado dinamicamente
    [PointsActionType.APP_RATED]: 50,
    [PointsActionType.REFERRAL_MADE]: 100,
    [PointsActionType.FEEDBACK_GIVEN]: 20,
    [PointsActionType.SHARED_ACHIEVEMENT]: 10,
    [PointsActionType.INVITED_FRIEND]: 25,
    [PointsActionType.CHALLENGE_COMPLETED]: 0, // Definido no desafio
    [PointsActionType.BONUS]: 0,
    [PointsActionType.ADMIN_GRANT]: 0,
    [PointsActionType.DEDUCTION]: 0,
    [PointsActionType.REDEMPTION]: 0,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
    private readonly auditService: AuditService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  // ==================== Event Handlers ====================

  @OnEvent('gamification.action')
  async handleGamificationAction(payload: {
    userId: string;
    action: PointsActionType;
    metadata?: Record<string, any>;
  }) {
    try {
      await this.recordAction(
        { actionType: payload.action, metadata: payload.metadata },
        payload.userId,
      );
    } catch (error) {
      console.error('Erro ao processar ação de gamificação:', error);
    }
  }

  // ==================== Achievements ====================

  async createAchievement(dto: CreateAchievementDto, requesterId: string) {
    // Verificar código único
    const existing = await this.prisma.achievement.findFirst({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Código de achievement já existe');
    }

    const achievement = await this.prisma.achievement.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        category: dto.category,
        rarity: dto.rarity,
        points: dto.points,
        iconUrl: dto.iconUrl,
        criteria: dto.criteria,
        isHidden: dto.isHidden || false,
        isActive: dto.isActive !== false,
        displayOrder: dto.displayOrder || 0,
        prerequisiteAchievementId: dto.prerequisiteAchievementId,
        createdById: requesterId,
      },
    });

    await this.auditService.log({
      action: 'ACHIEVEMENT_CREATED',
      entityType: 'Achievement',
      entityId: achievement.id,
      userId: requesterId,
      details: { code: dto.code },
    });

    return achievement;
  }

  async findAllAchievements(query: AchievementQueryDto) {
    const {
      page = 1,
      limit = 50,
      category,
      rarity,
      search,
      activeOnly,
      includeHidden,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.AchievementWhereInput = {};

    if (category) where.category = category;
    if (rarity) where.rarity = rarity;
    if (activeOnly) where.isActive = true;
    if (!includeHidden) where.isHidden = false;

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.achievement.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.achievement.count({ where }),
    ]);

    // Contar por categoria
    const byCategory = await this.prisma.achievement.groupBy({
      by: ['category'],
      _count: true,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      byCategory: Object.fromEntries(byCategory.map(c => [c.category, c._count])),
    };
  }

  async getUserAchievements(userId: string, query: UserAchievementsQueryDto) {
    const { page = 1, limit = 50, category, unlockedOnly, lockedOnly } = query;

    // Buscar todos os achievements ativos
    const achievementsWhere: Prisma.AchievementWhereInput = {
      isActive: true,
    };
    if (category) achievementsWhere.category = category;

    const achievements = await this.prisma.achievement.findMany({
      where: achievementsWhere,
      orderBy: { displayOrder: 'asc' },
    });

    // Buscar achievements do usuário
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    });

    const unlockedIds = new Set(userAchievements.map(ua => ua.achievementId));

    // Separar desbloqueados e bloqueados
    const unlocked = userAchievements
      .filter(ua => ua.isUnlocked)
      .map(ua => ({
        id: ua.id,
        achievement: ua.achievement,
        unlockedAt: ua.unlockedAt,
        progress: ua.progress,
        progressGoal: ua.progressGoal,
        isUnlocked: true,
        sharedAt: ua.sharedAt,
      }));

    const locked = achievements
      .filter(a => !unlockedIds.has(a.id))
      .filter(a => !a.isHidden) // Não mostrar ocultos
      .map(a => ({
        ...a,
        isUnlocked: false,
      }));

    // Aplicar filtros
    let result: any = { unlocked, locked };
    if (unlockedOnly) {
      result = { unlocked, locked: [] };
    } else if (lockedOnly) {
      result = { unlocked: [], locked };
    }

    // Recentes
    const recentUnlocks = unlocked
      .filter(u => u.isUnlocked)
      .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
      .slice(0, 5);

    return {
      ...result,
      totalUnlocked: unlocked.length,
      totalAchievements: achievements.length,
      completionPercentage: Math.round((unlocked.length / achievements.length) * 100),
      recentUnlocks,
    };
  }

  async unlockAchievement(userId: string, achievementCode: string) {
    const achievement = await this.prisma.achievement.findFirst({
      where: { code: achievementCode, isActive: true },
    });

    if (!achievement) {
      throw new NotFoundException('Achievement não encontrado');
    }

    // Verificar pré-requisito
    if (achievement.prerequisiteAchievementId) {
      const hasPrerequisite = await this.prisma.userAchievement.findFirst({
        where: {
          userId,
          achievementId: achievement.prerequisiteAchievementId,
          isUnlocked: true,
        },
      });

      if (!hasPrerequisite) {
        throw new BadRequestException('Pré-requisito não atendido');
      }
    }

    // Verificar se já tem
    const existing = await this.prisma.userAchievement.findFirst({
      where: { userId, achievementId: achievement.id },
    });

    if (existing?.isUnlocked) {
      return { alreadyUnlocked: true, achievement };
    }

    // Desbloquear ou atualizar
    const userAchievement = existing
      ? await this.prisma.userAchievement.update({
          where: { id: existing.id },
          data: { isUnlocked: true, unlockedAt: new Date() },
          include: { achievement: true },
        })
      : await this.prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
            isUnlocked: true,
            unlockedAt: new Date(),
          },
          include: { achievement: true },
        });

    // Conceder pontos
    await this.grantPoints({
      userId,
      points: achievement.points,
      actionType: PointsActionType.BONUS,
      description: `Achievement desbloqueado: ${achievement.name}`,
      relatedEntityId: achievement.id,
      relatedEntityType: 'Achievement',
    });

    // Notificar usuário
    this.eventEmitter.emit('notification.send', {
      type: 'ACHIEVEMENT_UNLOCKED',
      recipientId: userId,
      data: {
        achievementName: achievement.name,
        achievementIcon: achievement.iconUrl,
        points: achievement.points,
      },
    });

    return { unlocked: true, achievement: userAchievement };
  }

  async checkAndUnlockAchievements(userId: string, actionType: PointsActionType, metadata?: any) {
    // Buscar achievements que podem ser desbloqueados com esta ação
    const achievements = await this.prisma.achievement.findMany({
      where: {
        isActive: true,
        criteria: { path: ['actionType'], equals: actionType },
      },
    });

    const unlocked = [];

    for (const achievement of achievements) {
      const criteria = achievement.criteria as any;
      const shouldUnlock = await this.evaluateCriteria(userId, criteria, metadata);

      if (shouldUnlock) {
        const result = await this.unlockAchievement(userId, achievement.code);
        if (result.unlocked) {
          unlocked.push(achievement);
        }
      }
    }

    return unlocked;
  }

  private async evaluateCriteria(userId: string, criteria: any, metadata?: any): Promise<boolean> {
    if (!criteria) return false;

    // Critério de contagem
    if (criteria.countType && criteria.threshold) {
      const count = await this.getActionCount(userId, criteria.countType, criteria.timeframe);
      return count >= criteria.threshold;
    }

    // Critério de streak
    if (criteria.streakType && criteria.streakDays) {
      const streak = await this.getCurrentStreak(userId, criteria.streakType);
      return streak >= criteria.streakDays;
    }

    // Critério de nível
    if (criteria.minLevel) {
      const profile = await this.getPointsBalance(userId);
      return profile.level >= criteria.minLevel;
    }

    return false;
  }

  private async getActionCount(userId: string, actionType: string, timeframe?: string): Promise<number> {
    const where: any = { userId, actionType };

    if (timeframe) {
      const now = new Date();
      if (timeframe === 'day') {
        where.createdAt = { gte: new Date(now.setHours(0, 0, 0, 0)) };
      } else if (timeframe === 'week') {
        where.createdAt = { gte: new Date(now.setDate(now.getDate() - 7)) };
      } else if (timeframe === 'month') {
        where.createdAt = { gte: new Date(now.setMonth(now.getMonth() - 1)) };
      }
    }

    return this.prisma.pointsTransaction.count({ where });
  }

  // ==================== Challenges ====================

  async createChallenge(dto: CreateChallengeDto, requesterId: string) {
    const existing = await this.prisma.challenge.findFirst({
      where: { code: dto.code },
    });

    if (existing) {
      throw new ConflictException('Código de desafio já existe');
    }

    const challenge = await this.prisma.challenge.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        goal: dto.goal,
        goalUnit: dto.goalUnit,
        rewardPoints: dto.rewardPoints,
        rewardBadgeId: dto.rewardBadgeId,
        criteria: dto.criteria,
        maxParticipants: dto.maxParticipants,
        iconUrl: dto.iconUrl,
        themeColor: dto.themeColor,
        isActive: dto.isActive !== false,
        createdById: requesterId,
      },
    });

    await this.auditService.log({
      action: 'CHALLENGE_CREATED',
      entityType: 'Challenge',
      entityId: challenge.id,
      userId: requesterId,
      details: { code: dto.code },
    });

    return challenge;
  }

  async findAllChallenges(query: ChallengeQueryDto, requesterId?: string) {
    const {
      page = 1,
      limit = 20,
      type,
      status,
      activeOnly,
      joinedOnly,
      availableOnly,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.ChallengeWhereInput = {};

    if (type) where.type = type;
    if (activeOnly) where.isActive = true;

    const now = new Date();

    // Filtrar por status baseado em datas
    if (status === ChallengeStatus.ACTIVE) {
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    } else if (status === ChallengeStatus.EXPIRED) {
      where.endDate = { lt: now };
    }

    // Desafios que o usuário participa
    if (joinedOnly && requesterId) {
      where.participants = {
        some: { userId: requesterId },
      };
    }

    // Desafios disponíveis (não participa ainda e tem vaga)
    if (availableOnly && requesterId) {
      where.participants = {
        none: { userId: requesterId },
      };
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    const [data, total] = await Promise.all([
      this.prisma.challenge.findMany({
        where,
        include: {
          _count: { select: { participants: true } },
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.challenge.count({ where }),
    ]);

    // Adicionar informações adicionais
    const formattedData = data.map(challenge => ({
      ...challenge,
      currentParticipants: challenge._count.participants,
      timeRemaining: this.calculateTimeRemaining(challenge.endDate),
    }));

    return {
      data: formattedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      activeChallenges: data.filter(c => c.isActive && c.endDate >= now).length,
    };
  }

  async joinChallenge(dto: JoinChallengeDto, userId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: dto.challengeId },
      include: { _count: { select: { participants: true } } },
    });

    if (!challenge) {
      throw new NotFoundException('Desafio não encontrado');
    }

    if (!challenge.isActive) {
      throw new BadRequestException('Desafio não está ativo');
    }

    const now = new Date();
    if (challenge.startDate > now) {
      throw new BadRequestException('Desafio ainda não começou');
    }

    if (challenge.endDate < now) {
      throw new BadRequestException('Desafio já terminou');
    }

    // Verificar limite de participantes
    if (challenge.maxParticipants && challenge._count.participants >= challenge.maxParticipants) {
      throw new BadRequestException('Desafio atingiu o limite de participantes');
    }

    // Verificar se já participa
    const existing = await this.prisma.challengeParticipant.findFirst({
      where: { challengeId: dto.challengeId, userId },
    });

    if (existing) {
      throw new ConflictException('Você já está participando deste desafio');
    }

    const participant = await this.prisma.challengeParticipant.create({
      data: {
        challengeId: dto.challengeId,
        userId,
        status: ChallengeStatus.ACTIVE,
        progress: 0,
      },
      include: { challenge: true },
    });

    // Gamificação: pontos por participar
    await this.grantPoints({
      userId,
      points: 10,
      actionType: PointsActionType.BONUS,
      description: `Participou do desafio: ${challenge.name}`,
      relatedEntityId: challenge.id,
      relatedEntityType: 'Challenge',
    });

    return {
      id: participant.id,
      challenge,
      progress: 0,
      progressPercentage: 0,
      status: ChallengeStatus.ACTIVE,
      joinedAt: participant.joinedAt,
    };
  }

  async updateChallengeProgress(dto: UpdateChallengeProgressDto, userId: string) {
    const participant = await this.prisma.challengeParticipant.findFirst({
      where: { challengeId: dto.challengeId, userId },
      include: { challenge: true },
    });

    if (!participant) {
      throw new NotFoundException('Você não está participando deste desafio');
    }

    if (participant.status === ChallengeStatus.COMPLETED) {
      return { alreadyCompleted: true };
    }

    const newProgress = participant.progress + dto.progress;
    const isCompleted = newProgress >= participant.challenge.goal;

    const updated = await this.prisma.challengeParticipant.update({
      where: { id: participant.id },
      data: {
        progress: newProgress,
        status: isCompleted ? ChallengeStatus.COMPLETED : ChallengeStatus.ACTIVE,
        completedAt: isCompleted ? new Date() : null,
      },
      include: { challenge: true },
    });

    // Se completou, dar recompensa
    if (isCompleted) {
      await this.grantPoints({
        userId,
        points: participant.challenge.rewardPoints,
        actionType: PointsActionType.CHALLENGE_COMPLETED,
        description: `Completou o desafio: ${participant.challenge.name}`,
        relatedEntityId: participant.challenge.id,
        relatedEntityType: 'Challenge',
      });

      // Notificar
      this.eventEmitter.emit('notification.send', {
        type: 'CHALLENGE_COMPLETED',
        recipientId: userId,
        data: {
          challengeName: participant.challenge.name,
          rewardPoints: participant.challenge.rewardPoints,
        },
      });

      // Verificar achievements relacionados a desafios
      await this.checkAndUnlockAchievements(userId, PointsActionType.CHALLENGE_COMPLETED);
    }

    return {
      id: updated.id,
      challenge: updated.challenge,
      progress: updated.progress,
      progressPercentage: Math.min(100, Math.round((updated.progress / updated.challenge.goal) * 100)),
      status: updated.status,
      completedAt: updated.completedAt,
    };
  }

  async getChallengeLeaderboard(challengeId: string, limit: number = 50) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Desafio não encontrado');
    }

    const participants = await this.prisma.challengeParticipant.findMany({
      where: { challengeId },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: [
        { completedAt: { sort: 'asc', nulls: 'last' } },
        { progress: 'desc' },
      ],
      take: limit,
    });

    return {
      challengeId,
      challengeName: challenge.name,
      participants: participants.map((p, index) => ({
        rank: index + 1,
        userId: p.userId,
        userName: p.user.name,
        avatarUrl: p.user.avatarUrl,
        progress: p.progress,
        progressPercentage: Math.min(100, Math.round((p.progress / challenge.goal) * 100)),
        completedAt: p.completedAt,
      })),
      total: participants.length,
    };
  }

  // ==================== Points ====================

  async grantPoints(dto: GrantPointsDto) {
    // Buscar perfil do usuário para aplicar multiplicador
    const userGamification = await this.getOrCreateUserGamification(dto.userId);
    const level = await this.getUserLevel(userGamification.totalPoints);
    const multiplier = level?.pointsMultiplier || 1;

    const pointsToGrant = Math.round(dto.points * multiplier);

    const transaction = await this.prisma.pointsTransaction.create({
      data: {
        userId: dto.userId,
        points: pointsToGrant,
        actionType: dto.actionType,
        description: dto.description,
        relatedEntityId: dto.relatedEntityId,
        relatedEntityType: dto.relatedEntityType,
        metadata: dto.metadata,
        balanceAfter: userGamification.totalPoints + pointsToGrant,
      },
    });

    // Atualizar saldo
    await this.prisma.userGamification.update({
      where: { id: userGamification.id },
      data: {
        totalPoints: { increment: pointsToGrant },
        availablePoints: { increment: pointsToGrant },
        lifetimePoints: { increment: pointsToGrant },
      },
    });

    // Verificar se subiu de nível
    await this.checkLevelUp(dto.userId, userGamification.totalPoints + pointsToGrant);

    // Invalidar cache
    await this.cacheService.delete(`gamification:user:${dto.userId}`);

    return transaction;
  }

  async deductPoints(dto: DeductPointsDto, requesterId: string) {
    const userGamification = await this.getOrCreateUserGamification(dto.userId);

    if (userGamification.availablePoints < dto.points) {
      throw new BadRequestException('Pontos insuficientes');
    }

    const transaction = await this.prisma.pointsTransaction.create({
      data: {
        userId: dto.userId,
        points: -dto.points,
        actionType: PointsActionType.DEDUCTION,
        description: dto.reason,
        relatedEntityId: dto.relatedEntityId,
        relatedEntityType: dto.relatedEntityType,
        balanceAfter: userGamification.totalPoints - dto.points,
      },
    });

    await this.prisma.userGamification.update({
      where: { id: userGamification.id },
      data: {
        totalPoints: { decrement: dto.points },
        availablePoints: { decrement: dto.points },
      },
    });

    await this.auditService.log({
      action: 'POINTS_DEDUCTED',
      entityType: 'PointsTransaction',
      entityId: transaction.id,
      userId: requesterId,
      details: { targetUserId: dto.userId, points: dto.points, reason: dto.reason },
    });

    await this.cacheService.delete(`gamification:user:${dto.userId}`);

    return transaction;
  }

  async getPointsBalance(userId: string) {
    const userGamification = await this.getOrCreateUserGamification(userId);
    const level = await this.getUserLevel(userGamification.totalPoints);
    const nextLevel = await this.getNextLevel(level?.level || 0);

    return {
      userId,
      totalPoints: userGamification.totalPoints,
      availablePoints: userGamification.availablePoints,
      spentPoints: userGamification.spentPoints,
      pendingPoints: userGamification.pendingPoints,
      lifetimePoints: userGamification.lifetimePoints,
      level: level?.level || 1,
      levelName: level?.name || 'Iniciante',
      levelIconUrl: level?.iconUrl,
      pointsToNextLevel: nextLevel ? nextLevel.pointsRequired - userGamification.totalPoints : 0,
      levelProgress: nextLevel
        ? Math.round(((userGamification.totalPoints - (level?.pointsRequired || 0)) / (nextLevel.pointsRequired - (level?.pointsRequired || 0))) * 100)
        : 100,
      pointsMultiplier: level?.pointsMultiplier || 1,
    };
  }

  async getPointsHistory(userId: string, query: PointsHistoryQueryDto) {
    const { page = 1, limit = 50, actionType, startDate, endDate, earnedOnly, spentOnly, sortBy, sortOrder } = query;

    const where: Prisma.PointsTransactionWhereInput = { userId };

    if (actionType) where.actionType = actionType;
    if (earnedOnly) where.points = { gt: 0 };
    if (spentOnly) where.points = { lt: 0 };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total, summary] = await Promise.all([
      this.prisma.pointsTransaction.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.pointsTransaction.count({ where }),
      this.prisma.pointsTransaction.aggregate({
        where,
        _sum: { points: true },
      }),
    ]);

    const totalEarned = await this.prisma.pointsTransaction.aggregate({
      where: { ...where, points: { gt: 0 } },
      _sum: { points: true },
    });

    const totalSpent = await this.prisma.pointsTransaction.aggregate({
      where: { ...where, points: { lt: 0 } },
      _sum: { points: true },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalEarned: totalEarned._sum.points || 0,
        totalSpent: Math.abs(totalSpent._sum.points || 0),
        periodStart: startDate ? new Date(startDate) : null,
        periodEnd: endDate ? new Date(endDate) : null,
      },
    };
  }

  // ==================== Rewards ====================

  async createReward(dto: CreateRewardDto, requesterId: string) {
    const reward = await this.prisma.reward.create({
      data: {
        name: dto.name,
        description: dto.description,
        type: dto.type,
        pointsCost: dto.pointsCost,
        discountPercentage: dto.discountPercentage,
        discountAmount: dto.discountAmount,
        freeService: dto.freeService,
        quantity: dto.quantity,
        quantityRemaining: dto.quantity,
        validityDays: dto.validityDays,
        minLevel: dto.minLevel,
        imageUrl: dto.imageUrl,
        terms: dto.terms,
        isActive: dto.isActive !== false,
        isFeatured: dto.isFeatured || false,
        category: dto.category,
        createdById: requesterId,
      },
    });

    return reward;
  }

  async findAllRewards(query: RewardQueryDto, userId?: string) {
    const {
      page = 1,
      limit = 20,
      type,
      category,
      activeOnly,
      inStockOnly,
      withinMyLevel,
      maxPoints,
      featuredOnly,
      sortBy,
      sortOrder,
    } = query;

    const where: Prisma.RewardWhereInput = {};

    if (type) where.type = type;
    if (category) where.category = category;
    if (activeOnly) where.isActive = true;
    if (inStockOnly) {
      where.OR = [
        { quantity: null }, // Ilimitado
        { quantityRemaining: { gt: 0 } },
      ];
    }
    if (maxPoints) where.pointsCost = { lte: maxPoints };
    if (featuredOnly) where.isFeatured = true;

    // Verificar nível do usuário
    let userLevel = 1;
    if (withinMyLevel && userId) {
      const balance = await this.getPointsBalance(userId);
      userLevel = balance.level;
      where.OR = [
        { minLevel: null },
        { minLevel: { lte: userLevel } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.reward.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.reward.count({ where }),
    ]);

    // Adicionar informação de "pode resgatar" para o usuário
    let userBalance = 0;
    if (userId) {
      const balance = await this.getPointsBalance(userId);
      userBalance = balance.availablePoints;
      userLevel = balance.level;
    }

    const formattedData = data.map(reward => ({
      ...reward,
      canRedeem: userId ? this.canRedeemReward(reward, userBalance, userLevel) : null,
      cannotRedeemReason: userId ? this.getCannotRedeemReason(reward, userBalance, userLevel) : null,
    }));

    // Destaques
    const featured = await this.prisma.reward.findMany({
      where: { isFeatured: true, isActive: true },
      take: 5,
    });

    // Categorias
    const categories = await this.prisma.reward.findMany({
      where: { isActive: true },
      distinct: ['category'],
      select: { category: true },
    });

    return {
      data: formattedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      featured,
      categories: categories.map(c => c.category).filter(Boolean),
    };
  }

  async redeemReward(dto: RedeemRewardDto, userId: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { id: dto.rewardId },
    });

    if (!reward) {
      throw new NotFoundException('Recompensa não encontrada');
    }

    if (!reward.isActive) {
      throw new BadRequestException('Recompensa não está ativa');
    }

    // Verificar estoque
    if (reward.quantity !== null && reward.quantityRemaining <= 0) {
      throw new BadRequestException('Recompensa esgotada');
    }

    // Verificar pontos
    const balance = await this.getPointsBalance(userId);
    if (balance.availablePoints < reward.pointsCost) {
      throw new BadRequestException('Pontos insuficientes');
    }

    // Verificar nível
    if (reward.minLevel && balance.level < reward.minLevel) {
      throw new BadRequestException(`Nível mínimo necessário: ${reward.minLevel}`);
    }

    // Gerar código de resgate
    const redemptionCode = this.generateRedemptionCode();

    // Calcular validade
    const expiresAt = reward.validityDays
      ? new Date(Date.now() + reward.validityDays * 24 * 60 * 60 * 1000)
      : null;

    // Criar resgate
    const redemption = await this.prisma.$transaction(async (tx) => {
      // Deduzir pontos
      await tx.userGamification.update({
        where: { userId },
        data: {
          availablePoints: { decrement: reward.pointsCost },
          spentPoints: { increment: reward.pointsCost },
        },
      });

      // Registrar transação
      await tx.pointsTransaction.create({
        data: {
          userId,
          points: -reward.pointsCost,
          actionType: PointsActionType.REDEMPTION,
          description: `Resgate: ${reward.name}`,
          relatedEntityId: reward.id,
          relatedEntityType: 'Reward',
        },
      });

      // Atualizar estoque
      if (reward.quantity !== null) {
        await tx.reward.update({
          where: { id: reward.id },
          data: { quantityRemaining: { decrement: 1 } },
        });
      }

      // Criar registro de resgate
      return tx.rewardRedemption.create({
        data: {
          userId,
          rewardId: reward.id,
          pointsSpent: reward.pointsCost,
          redemptionCode,
          expiresAt,
          status: 'PENDING',
        },
        include: { reward: true },
      });
    });

    // Notificar usuário
    this.eventEmitter.emit('notification.send', {
      type: 'REWARD_REDEEMED',
      recipientId: userId,
      data: {
        rewardName: reward.name,
        redemptionCode,
        expiresAt,
      },
    });

    await this.cacheService.delete(`gamification:user:${userId}`);

    return redemption;
  }

  async getMyRedemptions(userId: string, query: MyRedemptionsQueryDto) {
    const { page = 1, limit = 20, status, startDate, endDate } = query;

    const where: Prisma.RewardRedemptionWhereInput = { userId };

    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.rewardRedemption.findMany({
        where,
        include: { reward: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.rewardRedemption.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ==================== Leaderboard ====================

  async getLeaderboard(query: LeaderboardQueryDto, requesterId?: string) {
    const { period = LeaderboardPeriod.WEEKLY, limit = 50, clinicId, category, includeMyPosition } = query;

    let startDate: Date;
    const now = new Date();

    switch (period) {
      case LeaderboardPeriod.DAILY:
        startDate = new Date(now.setHours(0, 0, 0, 0));
        break;
      case LeaderboardPeriod.WEEKLY:
        startDate = new Date(now.setDate(now.getDate() - now.getDay()));
        startDate.setHours(0, 0, 0, 0);
        break;
      case LeaderboardPeriod.MONTHLY:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case LeaderboardPeriod.ALL_TIME:
      default:
        startDate = new Date(0);
    }

    // Para leaderboard baseado em pontos do período
    const pointsInPeriod = await this.prisma.pointsTransaction.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate },
        points: { gt: 0 },
      },
      _sum: { points: true },
      orderBy: { _sum: { points: 'desc' } },
      take: limit,
    });

    // Buscar dados dos usuários
    const userIds = pointsInPeriod.map(p => p.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatarUrl: true },
    });

    const userGamifications = await this.prisma.userGamification.findMany({
      where: { userId: { in: userIds } },
    });

    const usersMap = new Map(users.map(u => [u.id, u]));
    const gamificationMap = new Map(userGamifications.map(g => [g.userId, g]));

    const entries = pointsInPeriod.map((entry, index) => {
      const user = usersMap.get(entry.userId);
      const gamification = gamificationMap.get(entry.userId);
      const level = this.getLevelSync(gamification?.totalPoints || 0);

      return {
        rank: index + 1,
        userId: entry.userId,
        userName: user?.name || 'Usuário',
        avatarUrl: user?.avatarUrl,
        points: entry._sum.points || 0,
        level: level.level,
        levelName: level.name,
        isCurrentUser: entry.userId === requesterId,
      };
    });

    // Posição do usuário atual
    let myPosition = null;
    if (includeMyPosition && requesterId && !entries.find(e => e.isCurrentUser)) {
      const myPoints = await this.prisma.pointsTransaction.aggregate({
        where: {
          userId: requesterId,
          createdAt: { gte: startDate },
          points: { gt: 0 },
        },
        _sum: { points: true },
      });

      const myRank = await this.prisma.pointsTransaction.groupBy({
        by: ['userId'],
        where: {
          createdAt: { gte: startDate },
          points: { gt: 0 },
        },
        _sum: { points: true },
        having: {
          points: { _sum: { gt: myPoints._sum.points || 0 } },
        },
      });

      const user = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { id: true, name: true, avatarUrl: true },
      });

      const gamification = await this.prisma.userGamification.findFirst({
        where: { userId: requesterId },
      });

      const level = this.getLevelSync(gamification?.totalPoints || 0);

      myPosition = {
        rank: myRank.length + 1,
        userId: requesterId,
        userName: user?.name || 'Você',
        avatarUrl: user?.avatarUrl,
        points: myPoints._sum.points || 0,
        level: level.level,
        levelName: level.name,
        isCurrentUser: true,
      };
    }

    return {
      period,
      entries,
      total: entries.length,
      myPosition,
      lastUpdated: new Date(),
    };
  }

  // ==================== Streaks ====================

  async recordStreak(dto: RecordStreakDto) {
    const { userId, streakType, metadata } = dto;

    let streak = await this.prisma.userStreak.findFirst({
      where: { userId, streakType },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (streak) {
      const lastActivity = new Date(streak.lastActivityDate);
      lastActivity.setHours(0, 0, 0, 0);

      const daysSinceLastActivity = Math.floor(
        (today.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000),
      );

      if (daysSinceLastActivity === 0) {
        // Já registrou hoje
        return streak;
      } else if (daysSinceLastActivity === 1) {
        // Continua a sequência
        const newStreak = streak.currentStreak + 1;
        streak = await this.prisma.userStreak.update({
          where: { id: streak.id },
          data: {
            currentStreak: newStreak,
            longestStreak: Math.max(newStreak, streak.longestStreak),
            lastActivityDate: new Date(),
          },
        });

        // Bonus de streak
        if (newStreak % 7 === 0) {
          await this.grantPoints({
            userId,
            points: newStreak * 2,
            actionType: PointsActionType.STREAK_BONUS,
            description: `Streak de ${newStreak} dias!`,
            metadata: { streakType, days: newStreak },
          });
        }

        // Verificar achievements de streak
        await this.checkAndUnlockAchievements(userId, PointsActionType.STREAK_BONUS, { streakType, days: newStreak });
      } else {
        // Perdeu a sequência
        streak = await this.prisma.userStreak.update({
          where: { id: streak.id },
          data: {
            currentStreak: 1,
            lastActivityDate: new Date(),
          },
        });
      }
    } else {
      // Primeiro registro
      streak = await this.prisma.userStreak.create({
        data: {
          userId,
          streakType,
          currentStreak: 1,
          longestStreak: 1,
          lastActivityDate: new Date(),
        },
      });
    }

    return streak;
  }

  async getCurrentStreak(userId: string, streakType: string): Promise<number> {
    const streak = await this.prisma.userStreak.findFirst({
      where: { userId, streakType },
    });

    if (!streak) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lastActivity = new Date(streak.lastActivityDate);
    lastActivity.setHours(0, 0, 0, 0);

    const daysSinceLastActivity = Math.floor(
      (today.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000),
    );

    if (daysSinceLastActivity > 1) {
      return 0; // Streak perdido
    }

    return streak.currentStreak;
  }

  async getStreaks(userId: string, query: StreakQueryDto) {
    const where: Prisma.UserStreakWhereInput = { userId };

    if (query.streakType && query.streakType !== 'ALL') {
      where.streakType = query.streakType;
    }

    const streaks = await this.prisma.userStreak.findMany({
      where,
    });

    const activeStreaks = streaks.filter(s => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastActivity = new Date(s.lastActivityDate);
      lastActivity.setHours(0, 0, 0, 0);
      const daysSince = Math.floor((today.getTime() - lastActivity.getTime()) / (24 * 60 * 60 * 1000));
      return daysSince <= 1;
    });

    return {
      streaks: streaks.map(s => ({
        userId: s.userId,
        streakType: s.streakType,
        currentStreak: s.currentStreak,
        longestStreak: s.longestStreak,
        lastActivityDate: s.lastActivityDate,
        nextMilestone: Math.ceil(s.currentStreak / 7) * 7,
        pointsPerDay: 5,
        bonusMultiplier: 1 + Math.floor(s.currentStreak / 7) * 0.1,
      })),
      totalStreakDays: streaks.reduce((acc, s) => acc + s.currentStreak, 0),
      activeStreaks: activeStreaks.length,
    };
  }

  // ==================== Actions ====================

  async recordAction(dto: RecordActionDto, userId: string) {
    // Conceder pontos pela ação
    const basePoints = this.POINTS_CONFIG[dto.actionType] || 0;

    if (basePoints > 0) {
      await this.grantPoints({
        userId,
        points: basePoints,
        actionType: dto.actionType,
        description: `Ação: ${dto.actionType}`,
        relatedEntityId: dto.relatedEntityId,
        relatedEntityType: dto.relatedEntityType,
        metadata: dto.metadata,
      });
    }

    // Verificar achievements
    await this.checkAndUnlockAchievements(userId, dto.actionType, dto.metadata);

    // Atualizar progresso de desafios
    await this.updateChallengesForAction(userId, dto.actionType, dto.metadata);

    // Registrar streak se aplicável
    if ([
      PointsActionType.DAILY_LOGIN,
      PointsActionType.MEDICATION_TAKEN,
      PointsActionType.HEALTH_DATA_LOGGED,
    ].includes(dto.actionType)) {
      await this.recordStreak({
        userId,
        streakType: dto.actionType === PointsActionType.DAILY_LOGIN ? 'LOGIN' : 'HEALTH_LOG',
      });
    }

    return { success: true, points: basePoints };
  }

  private async updateChallengesForAction(userId: string, actionType: PointsActionType, metadata?: any) {
    const participations = await this.prisma.challengeParticipant.findMany({
      where: {
        userId,
        status: ChallengeStatus.ACTIVE,
        challenge: {
          isActive: true,
          endDate: { gte: new Date() },
          criteria: { path: ['actionType'], equals: actionType },
        },
      },
      include: { challenge: true },
    });

    for (const participation of participations) {
      await this.updateChallengeProgress({
        challengeId: participation.challengeId,
        progress: 1,
        metadata,
      }, userId);
    }
  }

  // ==================== Referral ====================

  async createReferralCode(dto: CreateReferralCodeDto, userId: string) {
    // Verificar se já tem código ativo
    const existing = await this.prisma.referralCode.findFirst({
      where: { userId, isActive: true },
    });

    if (existing) {
      return existing;
    }

    const code = dto.customCode || this.generateReferralCode();
    const expiresAt = dto.validityDays
      ? new Date(Date.now() + dto.validityDays * 24 * 60 * 60 * 1000)
      : null;

    const referralCode = await this.prisma.referralCode.create({
      data: {
        userId,
        code,
        maxUses: dto.maxUses,
        expiresAt,
        isActive: true,
        pointsPerReferral: 100, // Configurável
      },
    });

    return {
      ...referralCode,
      shareUrl: `${this.configService.get('APP_URL')}/register?ref=${code}`,
    };
  }

  async useReferralCode(dto: UseReferralCodeDto, newUserId: string) {
    const referralCode = await this.prisma.referralCode.findFirst({
      where: { code: dto.referralCode, isActive: true },
    });

    if (!referralCode) {
      throw new NotFoundException('Código de indicação inválido');
    }

    if (referralCode.expiresAt && referralCode.expiresAt < new Date()) {
      throw new BadRequestException('Código expirado');
    }

    if (referralCode.maxUses && referralCode.timesUsed >= referralCode.maxUses) {
      throw new BadRequestException('Código atingiu o limite de usos');
    }

    if (referralCode.userId === newUserId) {
      throw new BadRequestException('Você não pode usar seu próprio código');
    }

    // Registrar uso
    await this.prisma.$transaction(async (tx) => {
      await tx.referralCode.update({
        where: { id: referralCode.id },
        data: {
          timesUsed: { increment: 1 },
          totalPointsEarned: { increment: referralCode.pointsPerReferral },
        },
      });

      await tx.referralUsage.create({
        data: {
          referralCodeId: referralCode.id,
          referrerId: referralCode.userId,
          referredId: newUserId,
        },
      });
    });

    // Dar pontos ao indicador
    await this.grantPoints({
      userId: referralCode.userId,
      points: referralCode.pointsPerReferral,
      actionType: PointsActionType.REFERRAL_MADE,
      description: 'Indicação bem-sucedida',
      relatedEntityId: newUserId,
      relatedEntityType: 'User',
    });

    // Dar pontos ao indicado
    await this.grantPoints({
      userId: newUserId,
      points: 50, // Bônus de boas-vindas
      actionType: PointsActionType.BONUS,
      description: 'Bônus de indicação',
    });

    return { success: true };
  }

  // ==================== Profile/Dashboard ====================

  async getProfile(userId: string) {
    const [
      pointsBalance,
      streaks,
      achievements,
      challenges,
      redemptions,
      user,
    ] = await Promise.all([
      this.getPointsBalance(userId),
      this.getStreaks(userId, {}),
      this.getUserAchievements(userId, {}),
      this.prisma.challengeParticipant.count({
        where: { userId },
      }),
      this.prisma.rewardRedemption.count({
        where: { userId },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, avatarUrl: true, createdAt: true },
      }),
    ]);

    const activeChallenges = await this.prisma.challengeParticipant.count({
      where: { userId, status: ChallengeStatus.ACTIVE },
    });

    const completedChallenges = await this.prisma.challengeParticipant.count({
      where: { userId, status: ChallengeStatus.COMPLETED },
    });

    // Achievements recentes
    const recentAchievements = await this.prisma.userAchievement.findMany({
      where: { userId, isUnlocked: true },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
      take: 5,
    });

    // Desafios ativos
    const activeChallengesList = await this.prisma.challengeParticipant.findMany({
      where: { userId, status: ChallengeStatus.ACTIVE },
      include: { challenge: true },
      take: 5,
    });

    return {
      userId,
      userName: user?.name,
      avatarUrl: user?.avatarUrl,
      points: pointsBalance,
      streaks,
      achievementsUnlocked: achievements.totalUnlocked,
      achievementsTotal: achievements.totalAchievements,
      challengesCompleted: completedChallenges,
      challengesActive: activeChallenges,
      rewardsRedeemed: redemptions,
      recentAchievements: recentAchievements.map(ua => ({
        id: ua.id,
        achievement: ua.achievement,
        unlockedAt: ua.unlockedAt,
        isUnlocked: true,
      })),
      activeChallenges: activeChallengesList.map(cp => ({
        id: cp.id,
        challenge: cp.challenge,
        progress: cp.progress,
        progressPercentage: Math.round((cp.progress / cp.challenge.goal) * 100),
        status: cp.status,
        joinedAt: cp.joinedAt,
      })),
      memberSince: user?.createdAt,
    };
  }

  async getDashboard(userId: string) {
    const profile = await this.getProfile(userId);

    const [featuredChallenges, featuredRewards, weeklyLeaderboard] = await Promise.all([
      this.prisma.challenge.findMany({
        where: {
          isActive: true,
          endDate: { gte: new Date() },
        },
        orderBy: { endDate: 'asc' },
        take: 3,
      }),
      this.prisma.reward.findMany({
        where: { isFeatured: true, isActive: true },
        take: 3,
      }),
      this.getLeaderboard({ period: LeaderboardPeriod.WEEKLY, limit: 10, includeMyPosition: true }, userId),
    ]);

    return {
      profile,
      featuredChallenges,
      featuredRewards,
      weeklyLeaderboard,
      dailyTip: this.getDailyTip(),
    };
  }

  // ==================== Statistics ====================

  async getStatistics(query: GamificationStatsQueryDto) {
    const { clinicId, startDate, endDate, groupBy, includeEngagement } = query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const [
      totalUsers,
      activeUsers,
      totalPointsDistributed,
      totalPointsRedeemed,
      achievementsUnlocked,
      challengesCompleted,
      rewardsRedeemed,
    ] = await Promise.all([
      this.prisma.userGamification.count(),
      this.prisma.pointsTransaction.groupBy({
        by: ['userId'],
        where: { createdAt: { gte: start, lte: end } },
      }).then(r => r.length),
      this.prisma.pointsTransaction.aggregate({
        where: { createdAt: { gte: start, lte: end }, points: { gt: 0 } },
        _sum: { points: true },
      }),
      this.prisma.pointsTransaction.aggregate({
        where: {
          createdAt: { gte: start, lte: end },
          actionType: PointsActionType.REDEMPTION,
        },
        _sum: { points: true },
      }),
      this.prisma.userAchievement.count({
        where: { unlockedAt: { gte: start, lte: end }, isUnlocked: true },
      }),
      this.prisma.challengeParticipant.count({
        where: { completedAt: { gte: start, lte: end }, status: ChallengeStatus.COMPLETED },
      }),
      this.prisma.rewardRedemption.count({
        where: { createdAt: { gte: start, lte: end } },
      }),
    ]);

    return {
      period: { start, end },
      totalUsers,
      activeUsers,
      totalPointsDistributed: totalPointsDistributed._sum.points || 0,
      totalPointsRedeemed: Math.abs(totalPointsRedeemed._sum.points || 0),
      achievementsUnlocked,
      challengesCompleted,
      rewardsRedeemed,
      engagementRate: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0,
    };
  }

  // ==================== Helpers ====================

  private async getOrCreateUserGamification(userId: string) {
    let gamification = await this.prisma.userGamification.findFirst({
      where: { userId },
    });

    if (!gamification) {
      gamification = await this.prisma.userGamification.create({
        data: {
          userId,
          totalPoints: 0,
          availablePoints: 0,
          spentPoints: 0,
          pendingPoints: 0,
          lifetimePoints: 0,
        },
      });
    }

    return gamification;
  }

  private async getUserLevel(totalPoints: number) {
    return this.prisma.level.findFirst({
      where: { pointsRequired: { lte: totalPoints } },
      orderBy: { pointsRequired: 'desc' },
    });
  }

  private async getNextLevel(currentLevel: number) {
    return this.prisma.level.findFirst({
      where: { level: currentLevel + 1 },
    });
  }

  private getLevelSync(totalPoints: number) {
    // Níveis padrão para uso síncrono
    const levels = [
      { level: 1, name: 'Iniciante', pointsRequired: 0 },
      { level: 2, name: 'Aprendiz', pointsRequired: 100 },
      { level: 3, name: 'Praticante', pointsRequired: 300 },
      { level: 4, name: 'Dedicado', pointsRequired: 600 },
      { level: 5, name: 'Experiente', pointsRequired: 1000 },
      { level: 6, name: 'Veterano', pointsRequired: 1500 },
      { level: 7, name: 'Mestre', pointsRequired: 2500 },
      { level: 8, name: 'Especialista', pointsRequired: 4000 },
      { level: 9, name: 'Elite', pointsRequired: 6000 },
      { level: 10, name: 'Lendário', pointsRequired: 10000 },
    ];

    for (let i = levels.length - 1; i >= 0; i--) {
      if (totalPoints >= levels[i].pointsRequired) {
        return levels[i];
      }
    }

    return levels[0];
  }

  private async checkLevelUp(userId: string, newTotalPoints: number) {
    const currentLevel = await this.getUserLevel(newTotalPoints);
    const previousLevel = await this.getUserLevel(newTotalPoints - 1);

    if (currentLevel && previousLevel && currentLevel.level > previousLevel.level) {
      // Subiu de nível!
      this.eventEmitter.emit('notification.send', {
        type: 'LEVEL_UP',
        recipientId: userId,
        data: {
          newLevel: currentLevel.level,
          levelName: currentLevel.name,
          benefits: currentLevel.benefits,
        },
      });

      // Verificar achievements de nível
      await this.checkAndUnlockAchievements(userId, PointsActionType.BONUS, { level: currentLevel.level });
    }
  }

  private canRedeemReward(reward: any, userBalance: number, userLevel: number): boolean {
    if (reward.pointsCost > userBalance) return false;
    if (reward.minLevel && reward.minLevel > userLevel) return false;
    if (reward.quantity !== null && reward.quantityRemaining <= 0) return false;
    return true;
  }

  private getCannotRedeemReason(reward: any, userBalance: number, userLevel: number): string | null {
    if (reward.pointsCost > userBalance) {
      return `Você precisa de ${reward.pointsCost - userBalance} pontos adicionais`;
    }
    if (reward.minLevel && reward.minLevel > userLevel) {
      return `Nível mínimo necessário: ${reward.minLevel}`;
    }
    if (reward.quantity !== null && reward.quantityRemaining <= 0) {
      return 'Recompensa esgotada';
    }
    return null;
  }

  private calculateTimeRemaining(endDate: Date): string {
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();

    if (diff <= 0) return 'Encerrado';

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (days > 0) return `${days}d ${hours}h restantes`;
    return `${hours}h restantes`;
  }

  private generateRedemptionCode(): string {
    return `RDM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private generateReferralCode(): string {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
  }

  private getDailyTip(): string {
    const tips = [
      'Complete seu perfil para ganhar 100 pontos extras!',
      'Não esqueça de tomar seus medicamentos e registrar no app.',
      'Participe dos desafios semanais para ganhar badges exclusivos.',
      'Convide amigos e ganhe pontos por cada indicação.',
      'Mantenha sua sequência de login para bônus especiais.',
    ];
    return tips[new Date().getDay() % tips.length];
  }
}
