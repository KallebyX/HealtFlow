// ============================================================
// GAMIFICATION TYPES
// Tipos para sistema de gamificação
// ============================================================

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  tier: BadgeTier;
  requirement: BadgeRequirement;
  points: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientBadge {
  id: string;
  patientId: string;
  badgeId: string;
  badge: Badge;
  earnedAt: string;
  displayOrder?: number;
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  type: RewardType;
  value: number;
  pointsCost: number;
  stock?: number;
  expiresAt?: string;
  termsAndConditions?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientReward {
  id: string;
  patientId: string;
  rewardId: string;
  reward: Reward;
  status: RewardStatus;
  redeemedAt: string;
  usedAt?: string;
  expiresAt?: string;
  code?: string;
}

export interface Challenge {
  id: string;
  name: string;
  description: string;
  type: ChallengeType;
  target: number;
  reward: number;
  badgeId?: string;
  badge?: Badge;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PatientChallenge {
  id: string;
  patientId: string;
  challengeId: string;
  challenge: Challenge;
  progress: number;
  status: ChallengeStatus;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PointTransaction {
  id: string;
  patientId: string;
  type: TransactionType;
  points: number;
  description: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
}

export interface Leaderboard {
  rank: number;
  patientId: string;
  patientName: string;
  avatarUrl?: string;
  level: number;
  levelName: string;
  totalPoints: number;
  badgeCount: number;
}

export interface GamificationStats {
  totalPoints: number;
  availablePoints: number;
  level: number;
  levelName: string;
  levelProgress: number;
  pointsToNextLevel: number;
  badgesEarned: number;
  totalBadges: number;
  challengesCompleted: number;
  activeChallenges: number;
  rewardsRedeemed: number;
  currentStreak: number;
  longestStreak: number;
}

// Enums
export enum BadgeCategory {
  HEALTH = 'HEALTH',
  ENGAGEMENT = 'ENGAGEMENT',
  SOCIAL = 'SOCIAL',
  MILESTONE = 'MILESTONE',
  SPECIAL = 'SPECIAL',
}

export enum BadgeTier {
  BRONZE = 'BRONZE',
  SILVER = 'SILVER',
  GOLD = 'GOLD',
  PLATINUM = 'PLATINUM',
  DIAMOND = 'DIAMOND',
}

export interface BadgeRequirement {
  type: 'count' | 'streak' | 'milestone' | 'special';
  action: string;
  target: number;
}

export enum RewardType {
  DISCOUNT = 'DISCOUNT',
  CASHBACK = 'CASHBACK',
  FREE_SERVICE = 'FREE_SERVICE',
  PRIORITY = 'PRIORITY',
  MERCHANDISE = 'MERCHANDISE',
  VOUCHER = 'VOUCHER',
}

export enum RewardStatus {
  ACTIVE = 'ACTIVE',
  USED = 'USED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export enum ChallengeType {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  SPECIAL = 'SPECIAL',
}

export enum ChallengeStatus {
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

export enum TransactionType {
  EARNED = 'EARNED',
  SPENT = 'SPENT',
  BONUS = 'BONUS',
  EXPIRED = 'EXPIRED',
  REFUND = 'REFUND',
}

// Level definitions
export interface Level {
  level: number;
  name: string;
  minPoints: number;
  maxPoints: number;
  discount: number;
  color: string;
  icon: string;
}

export const LEVELS: Level[] = [
  { level: 1, name: 'Bronze', minPoints: 0, maxPoints: 500, discount: 0, color: '#CD7F32', icon: '🥉' },
  { level: 2, name: 'Prata', minPoints: 501, maxPoints: 2000, discount: 5, color: '#C0C0C0', icon: '🥈' },
  { level: 3, name: 'Ouro', minPoints: 2001, maxPoints: 5000, discount: 10, color: '#FFD700', icon: '🥇' },
  { level: 4, name: 'Platina', minPoints: 5001, maxPoints: 10000, discount: 15, color: '#E5E4E2', icon: '💎' },
  { level: 5, name: 'Diamante', minPoints: 10001, maxPoints: Infinity, discount: 20, color: '#B9F2FF', icon: '👑' },
];

// API Types
export interface BadgeListResponse {
  data: Badge[];
  total: number;
}

export interface RewardListResponse {
  data: Reward[];
  total: number;
}

export interface ChallengeListResponse {
  data: Challenge[];
  total: number;
}

export interface LeaderboardResponse {
  data: Leaderboard[];
  period: 'weekly' | 'monthly' | 'allTime';
  userRank?: number;
}

// Helper functions
export function getLevelFromPoints(points: number): Level {
  return LEVELS.find(l => points >= l.minPoints && points <= l.maxPoints) || LEVELS[0];
}

export function getBadgeTierLabel(tier: BadgeTier): string {
  const labels: Record<BadgeTier, string> = {
    [BadgeTier.BRONZE]: 'Bronze',
    [BadgeTier.SILVER]: 'Prata',
    [BadgeTier.GOLD]: 'Ouro',
    [BadgeTier.PLATINUM]: 'Platina',
    [BadgeTier.DIAMOND]: 'Diamante',
  };
  return labels[tier] || tier;
}

export function getBadgeTierColor(tier: BadgeTier): string {
  const colors: Record<BadgeTier, string> = {
    [BadgeTier.BRONZE]: 'text-amber-700 bg-amber-100',
    [BadgeTier.SILVER]: 'text-gray-600 bg-gray-100',
    [BadgeTier.GOLD]: 'text-yellow-700 bg-yellow-100',
    [BadgeTier.PLATINUM]: 'text-slate-600 bg-slate-100',
    [BadgeTier.DIAMOND]: 'text-cyan-700 bg-cyan-100',
  };
  return colors[tier] || 'text-gray-600 bg-gray-100';
}

export function getBadgeCategoryLabel(category: BadgeCategory): string {
  const labels: Record<BadgeCategory, string> = {
    [BadgeCategory.HEALTH]: 'Saúde',
    [BadgeCategory.ENGAGEMENT]: 'Engajamento',
    [BadgeCategory.SOCIAL]: 'Social',
    [BadgeCategory.MILESTONE]: 'Marco',
    [BadgeCategory.SPECIAL]: 'Especial',
  };
  return labels[category] || category;
}

export function getRewardTypeLabel(type: RewardType): string {
  const labels: Record<RewardType, string> = {
    [RewardType.DISCOUNT]: 'Desconto',
    [RewardType.CASHBACK]: 'Cashback',
    [RewardType.FREE_SERVICE]: 'Serviço Grátis',
    [RewardType.PRIORITY]: 'Prioridade',
    [RewardType.MERCHANDISE]: 'Brinde',
    [RewardType.VOUCHER]: 'Voucher',
  };
  return labels[type] || type;
}

export function getRewardStatusLabel(status: RewardStatus): string {
  const labels: Record<RewardStatus, string> = {
    [RewardStatus.ACTIVE]: 'Ativo',
    [RewardStatus.USED]: 'Utilizado',
    [RewardStatus.EXPIRED]: 'Expirado',
    [RewardStatus.CANCELLED]: 'Cancelado',
  };
  return labels[status] || status;
}

export function getChallengeTypeLabel(type: ChallengeType): string {
  const labels: Record<ChallengeType, string> = {
    [ChallengeType.DAILY]: 'Diário',
    [ChallengeType.WEEKLY]: 'Semanal',
    [ChallengeType.MONTHLY]: 'Mensal',
    [ChallengeType.SPECIAL]: 'Especial',
  };
  return labels[type] || type;
}

export function getChallengeStatusLabel(status: ChallengeStatus): string {
  const labels: Record<ChallengeStatus, string> = {
    [ChallengeStatus.ACTIVE]: 'Em Andamento',
    [ChallengeStatus.COMPLETED]: 'Concluído',
    [ChallengeStatus.FAILED]: 'Não Concluído',
    [ChallengeStatus.EXPIRED]: 'Expirado',
  };
  return labels[status] || status;
}
