// ============================================================
// GAMIFICATION API
// API para sistema de gamificação
// ============================================================

import api from '@/lib/api';
import type {
  Badge,
  BadgeListResponse,
  Reward,
  RewardListResponse,
  Challenge,
  ChallengeListResponse,
  PatientBadge,
  PatientReward,
  PatientChallenge,
  PointTransaction,
  LeaderboardResponse,
  GamificationStats,
} from '@/types/gamification';

export const gamificationApi = {
  // ========== BADGES ==========

  // Listar todos os badges
  listBadges: async (): Promise<BadgeListResponse> => {
    const response = await api.get<BadgeListResponse>('/gamification/badges');
    return response.data;
  },

  // Buscar badge por ID
  getBadge: async (id: string): Promise<Badge> => {
    const response = await api.get<Badge>(`/gamification/badges/${id}`);
    return response.data;
  },

  // Buscar badges do paciente
  getPatientBadges: async (patientId: string): Promise<PatientBadge[]> => {
    const response = await api.get<PatientBadge[]>(`/gamification/patients/${patientId}/badges`);
    return response.data;
  },

  // ========== RECOMPENSAS ==========

  // Listar recompensas disponíveis
  listRewards: async (): Promise<RewardListResponse> => {
    const response = await api.get<RewardListResponse>('/gamification/rewards');
    return response.data;
  },

  // Buscar recompensa por ID
  getReward: async (id: string): Promise<Reward> => {
    const response = await api.get<Reward>(`/gamification/rewards/${id}`);
    return response.data;
  },

  // Buscar recompensas do paciente
  getPatientRewards: async (patientId: string): Promise<PatientReward[]> => {
    const response = await api.get<PatientReward[]>(`/gamification/patients/${patientId}/rewards`);
    return response.data;
  },

  // Resgatar recompensa
  redeemReward: async (patientId: string, rewardId: string): Promise<PatientReward> => {
    const response = await api.post<PatientReward>(`/gamification/patients/${patientId}/rewards/${rewardId}/redeem`);
    return response.data;
  },

  // ========== DESAFIOS ==========

  // Listar desafios ativos
  listChallenges: async (status?: string): Promise<ChallengeListResponse> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get<ChallengeListResponse>(`/gamification/challenges${params}`);
    return response.data;
  },

  // Buscar desafio por ID
  getChallenge: async (id: string): Promise<Challenge> => {
    const response = await api.get<Challenge>(`/gamification/challenges/${id}`);
    return response.data;
  },

  // Buscar desafios do paciente
  getPatientChallenges: async (patientId: string): Promise<PatientChallenge[]> => {
    const response = await api.get<PatientChallenge[]>(`/gamification/patients/${patientId}/challenges`);
    return response.data;
  },

  // Participar de desafio
  joinChallenge: async (patientId: string, challengeId: string): Promise<PatientChallenge> => {
    const response = await api.post<PatientChallenge>(`/gamification/patients/${patientId}/challenges/${challengeId}/join`);
    return response.data;
  },

  // ========== PONTOS ==========

  // Buscar estatísticas de gamificação do paciente
  getPatientStats: async (patientId: string): Promise<GamificationStats> => {
    const response = await api.get<GamificationStats>(`/gamification/patients/${patientId}/stats`);
    return response.data;
  },

  // Buscar histórico de pontos
  getPointsHistory: async (patientId: string, limit?: number): Promise<PointTransaction[]> => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await api.get<PointTransaction[]>(`/gamification/patients/${patientId}/points/history${params}`);
    return response.data;
  },

  // Adicionar pontos (admin)
  addPoints: async (patientId: string, points: number, description: string, type?: string): Promise<PointTransaction> => {
    const response = await api.post<PointTransaction>(`/gamification/patients/${patientId}/points`, {
      points,
      description,
      type: type || 'BONUS',
    });
    return response.data;
  },

  // ========== LEADERBOARD ==========

  // Buscar ranking
  getLeaderboard: async (period: 'weekly' | 'monthly' | 'allTime' = 'monthly', limit?: number): Promise<LeaderboardResponse> => {
    const params = new URLSearchParams({ period });
    if (limit) params.append('limit', String(limit));
    const response = await api.get<LeaderboardResponse>(`/gamification/leaderboard?${params.toString()}`);
    return response.data;
  },

  // Buscar posição do paciente no ranking
  getPatientRank: async (patientId: string, period?: string): Promise<{ rank: number; total: number }> => {
    const params = period ? `?period=${period}` : '';
    const response = await api.get(`/gamification/patients/${patientId}/rank${params}`);
    return response.data;
  },

  // ========== ADMIN ==========

  // Criar badge (admin)
  createBadge: async (data: Partial<Badge>): Promise<Badge> => {
    const response = await api.post<Badge>('/gamification/badges', data);
    return response.data;
  },

  // Atualizar badge (admin)
  updateBadge: async (id: string, data: Partial<Badge>): Promise<Badge> => {
    const response = await api.patch<Badge>(`/gamification/badges/${id}`, data);
    return response.data;
  },

  // Criar recompensa (admin)
  createReward: async (data: Partial<Reward>): Promise<Reward> => {
    const response = await api.post<Reward>('/gamification/rewards', data);
    return response.data;
  },

  // Atualizar recompensa (admin)
  updateReward: async (id: string, data: Partial<Reward>): Promise<Reward> => {
    const response = await api.patch<Reward>(`/gamification/rewards/${id}`, data);
    return response.data;
  },

  // Criar desafio (admin)
  createChallenge: async (data: Partial<Challenge>): Promise<Challenge> => {
    const response = await api.post<Challenge>('/gamification/challenges', data);
    return response.data;
  },

  // Atualizar desafio (admin)
  updateChallenge: async (id: string, data: Partial<Challenge>): Promise<Challenge> => {
    const response = await api.patch<Challenge>(`/gamification/challenges/${id}`, data);
    return response.data;
  },

  // Conceder badge manualmente (admin)
  awardBadge: async (patientId: string, badgeId: string): Promise<PatientBadge> => {
    const response = await api.post<PatientBadge>(`/gamification/patients/${patientId}/badges/${badgeId}/award`);
    return response.data;
  },
};

export default gamificationApi;
