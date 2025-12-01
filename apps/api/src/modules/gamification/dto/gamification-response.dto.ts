import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AchievementCategory,
  AchievementRarity,
  ChallengeType,
  ChallengeStatus,
  RewardType,
  BadgeType,
  PointsActionType,
} from './create-gamification.dto';

// ==================== Achievement DTOs ====================

export class AchievementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: AchievementCategory })
  category: AchievementCategory;

  @ApiProperty({ enum: AchievementRarity })
  rarity: AchievementRarity;

  @ApiProperty()
  points: number;

  @ApiPropertyOptional()
  iconUrl?: string;

  @ApiPropertyOptional()
  criteria?: Record<string, any>;

  @ApiPropertyOptional()
  isHidden?: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  displayOrder?: number;

  @ApiPropertyOptional()
  prerequisiteAchievementId?: string;

  @ApiProperty()
  createdAt: Date;
}

export class UserAchievementResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: AchievementResponseDto })
  achievement: AchievementResponseDto;

  @ApiProperty()
  unlockedAt: Date;

  @ApiPropertyOptional()
  progress?: number;

  @ApiPropertyOptional()
  progressGoal?: number;

  @ApiProperty()
  isUnlocked: boolean;

  @ApiPropertyOptional()
  sharedAt?: Date;
}

export class AchievementListResponseDto {
  @ApiProperty({ type: [AchievementResponseDto] })
  data: AchievementResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional()
  byCategory?: Record<string, number>;
}

export class UserAchievementsResponseDto {
  @ApiProperty({ type: [UserAchievementResponseDto] })
  unlocked: UserAchievementResponseDto[];

  @ApiProperty({ type: [AchievementResponseDto] })
  locked: AchievementResponseDto[];

  @ApiProperty()
  totalUnlocked: number;

  @ApiProperty()
  totalAchievements: number;

  @ApiProperty()
  completionPercentage: number;

  @ApiPropertyOptional()
  recentUnlocks?: UserAchievementResponseDto[];
}

// ==================== Challenge DTOs ====================

export class ChallengeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: ChallengeType })
  type: ChallengeType;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  goal: number;

  @ApiProperty()
  goalUnit: string;

  @ApiProperty()
  rewardPoints: number;

  @ApiPropertyOptional()
  rewardBadgeId?: string;

  @ApiPropertyOptional()
  criteria?: Record<string, any>;

  @ApiPropertyOptional()
  maxParticipants?: number;

  @ApiProperty()
  currentParticipants: number;

  @ApiPropertyOptional()
  iconUrl?: string;

  @ApiPropertyOptional()
  themeColor?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  timeRemaining?: string;

  @ApiProperty()
  createdAt: Date;
}

export class UserChallengeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ type: ChallengeResponseDto })
  challenge: ChallengeResponseDto;

  @ApiProperty()
  progress: number;

  @ApiProperty()
  progressPercentage: number;

  @ApiProperty({ enum: ChallengeStatus })
  status: ChallengeStatus;

  @ApiProperty()
  joinedAt: Date;

  @ApiPropertyOptional()
  completedAt?: Date;

  @ApiPropertyOptional()
  rank?: number;
}

export class ChallengeListResponseDto {
  @ApiProperty({ type: [ChallengeResponseDto] })
  data: ChallengeResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional()
  activeChallenges?: number;
}

export class ChallengeLeaderboardResponseDto {
  @ApiProperty()
  challengeId: string;

  @ApiProperty()
  challengeName: string;

  @ApiProperty({ type: [ChallengeParticipantDto] })
  participants: ChallengeParticipantDto[];

  @ApiProperty()
  total: number;

  @ApiPropertyOptional()
  myPosition?: ChallengeParticipantDto;
}

export class ChallengeParticipantDto {
  @ApiProperty()
  rank: number;

  @ApiProperty()
  usedId: string;

  @ApiProperty()
  userName: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty()
  progress: number;

  @ApiProperty()
  progressPercentage: number;

  @ApiPropertyOptional()
  completedAt?: Date;
}

// ==================== Points DTOs ====================

export class PointsBalanceResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  totalPoints: number;

  @ApiProperty()
  availablePoints: number;

  @ApiProperty()
  spentPoints: number;

  @ApiProperty()
  pendingPoints: number;

  @ApiProperty()
  lifetimePoints: number;

  @ApiProperty()
  level: number;

  @ApiProperty()
  levelName: string;

  @ApiPropertyOptional()
  levelIconUrl?: string;

  @ApiProperty()
  pointsToNextLevel: number;

  @ApiProperty()
  levelProgress: number;

  @ApiPropertyOptional()
  pointsMultiplier?: number;
}

export class PointsTransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  points: number;

  @ApiProperty({ enum: PointsActionType })
  actionType: PointsActionType;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  relatedEntityId?: string;

  @ApiPropertyOptional()
  relatedEntityType?: string;

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty()
  balanceAfter: number;

  @ApiProperty()
  createdAt: Date;
}

export class PointsHistoryResponseDto {
  @ApiProperty({ type: [PointsTransactionResponseDto] })
  data: PointsTransactionResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional()
  summary?: {
    totalEarned: number;
    totalSpent: number;
    periodStart: Date;
    periodEnd: Date;
  };
}

// ==================== Leaderboard DTOs ====================

export class LeaderboardEntryDto {
  @ApiProperty()
  rank: number;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty()
  points: number;

  @ApiProperty()
  level: number;

  @ApiProperty()
  levelName: string;

  @ApiPropertyOptional()
  achievementsCount?: number;

  @ApiPropertyOptional()
  streakDays?: number;

  @ApiPropertyOptional()
  isCurrentUser?: boolean;
}

export class LeaderboardResponseDto {
  @ApiProperty()
  period: string;

  @ApiProperty({ type: [LeaderboardEntryDto] })
  entries: LeaderboardEntryDto[];

  @ApiProperty()
  total: number;

  @ApiPropertyOptional({ type: LeaderboardEntryDto })
  myPosition?: LeaderboardEntryDto;

  @ApiPropertyOptional()
  lastUpdated?: Date;
}

// ==================== Reward DTOs ====================

export class RewardResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: RewardType })
  type: RewardType;

  @ApiProperty()
  pointsCost: number;

  @ApiPropertyOptional()
  discountPercentage?: number;

  @ApiPropertyOptional()
  discountAmount?: number;

  @ApiPropertyOptional()
  freeService?: string;

  @ApiPropertyOptional()
  quantity?: number;

  @ApiPropertyOptional()
  quantityRemaining?: number;

  @ApiPropertyOptional()
  validityDays?: number;

  @ApiPropertyOptional()
  minLevel?: number;

  @ApiPropertyOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  terms?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiPropertyOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional()
  category?: string;

  @ApiPropertyOptional()
  canRedeem?: boolean;

  @ApiPropertyOptional()
  cannotRedeemReason?: string;

  @ApiProperty()
  createdAt: Date;
}

export class RewardListResponseDto {
  @ApiProperty({ type: [RewardResponseDto] })
  data: RewardResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;

  @ApiPropertyOptional()
  featured?: RewardResponseDto[];

  @ApiPropertyOptional()
  categories?: string[];
}

export class RedemptionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: RewardResponseDto })
  reward: RewardResponseDto;

  @ApiProperty()
  pointsSpent: number;

  @ApiProperty()
  status: string;

  @ApiProperty()
  redemptionCode: string;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiPropertyOptional()
  usedAt?: Date;

  @ApiProperty()
  createdAt: Date;
}

export class RedemptionListResponseDto {
  @ApiProperty({ type: [RedemptionResponseDto] })
  data: RedemptionResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

// ==================== Level DTOs ====================

export class LevelResponseDto {
  @ApiProperty()
  level: number;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  pointsRequired: number;

  @ApiPropertyOptional()
  iconUrl?: string;

  @ApiPropertyOptional()
  color?: string;

  @ApiPropertyOptional()
  benefits?: string[];

  @ApiPropertyOptional()
  pointsMultiplier?: number;

  @ApiPropertyOptional()
  usersCount?: number;
}

export class LevelsListResponseDto {
  @ApiProperty({ type: [LevelResponseDto] })
  levels: LevelResponseDto[];

  @ApiPropertyOptional()
  currentLevel?: LevelResponseDto;

  @ApiPropertyOptional()
  nextLevel?: LevelResponseDto;
}

// ==================== Streak DTOs ====================

export class StreakResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  streakType: string;

  @ApiProperty()
  currentStreak: number;

  @ApiProperty()
  longestStreak: number;

  @ApiProperty()
  lastActivityDate: Date;

  @ApiPropertyOptional()
  nextMilestone?: number;

  @ApiPropertyOptional()
  pointsPerDay?: number;

  @ApiPropertyOptional()
  bonusMultiplier?: number;
}

export class StreaksResponseDto {
  @ApiProperty({ type: [StreakResponseDto] })
  streaks: StreakResponseDto[];

  @ApiPropertyOptional()
  totalStreakDays?: number;

  @ApiPropertyOptional()
  activeStreaks?: number;
}

// ==================== Profile/Dashboard DTOs ====================

export class GamificationProfileResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  userName: string;

  @ApiPropertyOptional()
  avatarUrl?: string;

  @ApiProperty({ type: PointsBalanceResponseDto })
  points: PointsBalanceResponseDto;

  @ApiProperty({ type: StreaksResponseDto })
  streaks: StreaksResponseDto;

  @ApiProperty()
  achievementsUnlocked: number;

  @ApiProperty()
  achievementsTotal: number;

  @ApiProperty()
  challengesCompleted: number;

  @ApiProperty()
  challengesActive: number;

  @ApiProperty()
  rewardsRedeemed: number;

  @ApiPropertyOptional({ type: [UserAchievementResponseDto] })
  recentAchievements?: UserAchievementResponseDto[];

  @ApiPropertyOptional({ type: [UserChallengeResponseDto] })
  activeChallenges?: UserChallengeResponseDto[];

  @ApiPropertyOptional()
  rank?: number;

  @ApiPropertyOptional()
  rankChange?: number;

  @ApiProperty()
  memberSince: Date;
}

export class GamificationDashboardResponseDto {
  @ApiProperty({ type: GamificationProfileResponseDto })
  profile: GamificationProfileResponseDto;

  @ApiPropertyOptional({ type: [ChallengeResponseDto] })
  featuredChallenges?: ChallengeResponseDto[];

  @ApiPropertyOptional({ type: [RewardResponseDto] })
  featuredRewards?: RewardResponseDto[];

  @ApiPropertyOptional({ type: LeaderboardResponseDto })
  weeklyLeaderboard?: LeaderboardResponseDto;

  @ApiPropertyOptional()
  dailyTip?: string;

  @ApiPropertyOptional()
  notifications?: any[];
}

// ==================== Stats DTOs ====================

export class GamificationStatsResponseDto {
  @ApiProperty()
  period: {
    start: Date;
    end: Date;
  };

  @ApiProperty()
  totalUsers: number;

  @ApiProperty()
  activeUsers: number;

  @ApiProperty()
  totalPointsDistributed: number;

  @ApiProperty()
  totalPointsRedeemed: number;

  @ApiProperty()
  achievementsUnlocked: number;

  @ApiProperty()
  challengesCompleted: number;

  @ApiProperty()
  rewardsRedeemed: number;

  @ApiPropertyOptional()
  averageLevel?: number;

  @ApiPropertyOptional()
  engagementRate?: number;

  @ApiPropertyOptional()
  topAchievements?: Array<{
    achievement: AchievementResponseDto;
    count: number;
  }>;

  @ApiPropertyOptional()
  topChallenges?: Array<{
    challenge: ChallengeResponseDto;
    participants: number;
    completionRate: number;
  }>;

  @ApiPropertyOptional()
  dailyBreakdown?: Array<{
    date: string;
    pointsDistributed: number;
    achievementsUnlocked: number;
    activeUsers: number;
  }>;
}

// ==================== Referral DTOs ====================

export class ReferralCodeResponseDto {
  @ApiProperty()
  code: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  timesUsed: number;

  @ApiPropertyOptional()
  maxUses?: number;

  @ApiPropertyOptional()
  expiresAt?: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  pointsPerReferral: number;

  @ApiProperty()
  totalPointsEarned: number;

  @ApiProperty()
  createdAt: Date;

  @ApiPropertyOptional()
  shareUrl?: string;
}

export class ReferralStatsResponseDto {
  @ApiProperty()
  totalReferrals: number;

  @ApiProperty()
  successfulReferrals: number;

  @ApiProperty()
  pendingReferrals: number;

  @ApiProperty()
  totalPointsEarned: number;

  @ApiPropertyOptional({ type: ReferralCodeResponseDto })
  activeCode?: ReferralCodeResponseDto;

  @ApiPropertyOptional()
  referredUsers?: Array<{
    userName: string;
    joinedAt: Date;
    pointsEarned: number;
  }>;
}

// ==================== Badge DTOs ====================

export class BadgeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: BadgeType })
  type: BadgeType;

  @ApiProperty()
  iconUrl: string;

  @ApiPropertyOptional()
  color?: string;

  @ApiProperty()
  isUnlocked: boolean;

  @ApiPropertyOptional()
  unlockedAt?: Date;

  @ApiPropertyOptional()
  progress?: number;

  @ApiPropertyOptional()
  progressGoal?: number;
}

export class BadgesResponseDto {
  @ApiProperty({ type: [BadgeResponseDto] })
  badges: BadgeResponseDto[];

  @ApiProperty()
  totalUnlocked: number;

  @ApiProperty()
  totalBadges: number;
}
