'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Medal,
  Target,
  Gift,
  Zap,
  Flame,
  CheckCircle,
  Lock,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  LEVELS,
  getBadgeTierColor,
  getBadgeTierLabel,
  getRewardTypeLabel,
  getChallengeTypeLabel,
} from '@/types/gamification';
import { getInitials } from '@/lib/utils';

// Mock data
const mockStats = {
  totalPoints: 2850,
  availablePoints: 850,
  level: 3,
  levelName: 'Ouro',
  levelProgress: 65,
  pointsToNextLevel: 2150,
  badgesEarned: 8,
  totalBadges: 24,
  challengesCompleted: 12,
  activeChallenges: 3,
  rewardsRedeemed: 5,
  currentStreak: 7,
  longestStreak: 21,
};

const mockBadges = [
  { id: '1', name: 'Pontual', description: '5 consultas sem atrasos', icon: '🎯', tier: 'GOLD', earned: true },
  { id: '2', name: 'Saudavel', description: '30 dias consecutivos de login', icon: '💪', tier: 'SILVER', earned: true },
  { id: '3', name: 'Veterano', description: '1 ano usando o HealtFlow', icon: '🏆', tier: 'PLATINUM', earned: false },
  { id: '4', name: 'Avaliador', description: '10 avaliacoes de consultas', icon: '⭐', tier: 'BRONZE', earned: true },
  { id: '5', name: 'Compromissado', description: 'Nunca faltou uma consulta', icon: '🎖️', tier: 'GOLD', earned: true },
  { id: '6', name: 'Engajado', description: 'Complete seu perfil', icon: '📋', tier: 'BRONZE', earned: true },
  { id: '7', name: 'Telemedicina', description: '5 consultas por video', icon: '📱', tier: 'SILVER', earned: true },
  { id: '8', name: 'Social', description: 'Indique 3 amigos', icon: '👥', tier: 'GOLD', earned: false },
];

const mockChallenges = [
  { id: '1', name: 'Semana Saudavel', description: 'Faca check-in 5 dias seguidos', type: 'WEEKLY', progress: 60, reward: 100, target: 5, current: 3 },
  { id: '2', name: 'Avaliador do Mes', description: 'Avalie 5 consultas este mes', type: 'MONTHLY', progress: 40, reward: 200, target: 5, current: 2 },
  { id: '3', name: 'Perfil Completo', description: 'Complete todas as informacoes do perfil', type: 'SPECIAL', progress: 80, reward: 150, target: 10, current: 8 },
];

const mockRewards = [
  { id: '1', name: '10% de Desconto', description: 'Na proxima consulta', cost: 500, type: 'DISCOUNT', available: true },
  { id: '2', name: 'Consulta Prioritaria', description: 'Atendimento prioritario', cost: 1000, type: 'PRIORITY', available: true },
  { id: '3', name: 'Exame Gratis', description: 'Hemograma completo', cost: 2000, type: 'FREE_SERVICE', available: false },
  { id: '4', name: '20% de Desconto', description: 'Em procedimentos', cost: 1500, type: 'DISCOUNT', available: true },
];

const mockLeaderboard = [
  { rank: 1, name: 'Maria Silva', points: 5420, level: 5, badges: 18 },
  { rank: 2, name: 'Joao Costa', points: 4850, level: 4, badges: 15 },
  { rank: 3, name: 'Ana Santos', points: 4200, level: 4, badges: 14 },
  { rank: 4, name: 'Pedro Lima', points: 3800, level: 3, badges: 12 },
  { rank: 5, name: 'Lucia Ferreira', points: 3500, level: 3, badges: 11 },
  { rank: 6, name: 'Carlos Oliveira', points: 3200, level: 3, badges: 10 },
  { rank: 7, name: 'Fernanda Souza', points: 2900, level: 3, badges: 9 },
  { rank: 8, name: 'Voce', points: 2850, level: 3, badges: 8, isCurrentUser: true },
];

export default function GamificacaoPage() {
  const stats = mockStats;
  const currentLevel = LEVELS.find(l => l.level === stats.level) || LEVELS[2];
  const nextLevel = LEVELS[stats.level] || LEVELS[4];

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Gamificacao' },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gamificacao</h1>
          <p className="text-muted-foreground">
            Ganhe pontos, desbloqueie conquistas e troque por recompensas
          </p>
        </div>
      </div>

      {/* User Level Card */}
      <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-4xl">
                  {currentLevel.icon}
                </div>
                <Badge className="absolute -bottom-1 -right-1 bg-primary">
                  Nv.{stats.level}
                </Badge>
              </div>
              <div>
                <h2 className="text-2xl font-bold">{currentLevel.name}</h2>
                <p className="text-muted-foreground">
                  {stats.totalPoints.toLocaleString()} pontos totais
                </p>
                <p className="text-sm text-primary">
                  {currentLevel.discount}% de desconto em consultas
                </p>
              </div>
            </div>

            <div className="flex-1 max-w-md space-y-2">
              <div className="flex justify-between text-sm">
                <span>Proximo nivel: {nextLevel.name}</span>
                <span>{stats.pointsToNextLevel} pontos restantes</span>
              </div>
              <Progress value={stats.levelProgress} className="h-3" />
              <p className="text-xs text-muted-foreground text-center">
                {stats.levelProgress}% concluido
              </p>
            </div>

            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-1 text-2xl font-bold">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  {stats.availablePoints}
                </div>
                <p className="text-xs text-muted-foreground">Pontos disponiveis</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-2xl font-bold">
                  <Flame className="h-5 w-5 text-orange-500" />
                  {stats.currentStreak}
                </div>
                <p className="text-xs text-muted-foreground">Dias seguidos</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Badges</CardTitle>
            <Medal className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.badgesEarned}/{stats.totalBadges}</div>
            <Progress value={(stats.badgesEarned / stats.totalBadges) * 100} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Desafios</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.challengesCompleted}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeChallenges} em andamento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Recompensas</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rewardsRedeemed}</div>
            <p className="text-xs text-muted-foreground">
              resgatadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Maior Sequencia</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.longestStreak} dias</div>
            <p className="text-xs text-muted-foreground">
              recorde pessoal
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="badges" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="challenges">Desafios</TabsTrigger>
          <TabsTrigger value="rewards">Recompensas</TabsTrigger>
          <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
        </TabsList>

        {/* Badges Tab */}
        <TabsContent value="badges">
          <Card>
            <CardHeader>
              <CardTitle>Suas Conquistas</CardTitle>
              <CardDescription>
                Desbloqueie badges completando acoes no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {mockBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`relative rounded-lg border p-4 text-center transition-all ${
                      badge.earned
                        ? 'bg-card hover:shadow-md'
                        : 'bg-muted/30 opacity-60'
                    }`}
                  >
                    {!badge.earned && (
                      <div className="absolute top-2 right-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <h3 className="font-semibold">{badge.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {badge.description}
                    </p>
                    <Badge
                      className={`mt-2 ${getBadgeTierColor(badge.tier as any)}`}
                    >
                      {getBadgeTierLabel(badge.tier as any)}
                    </Badge>
                    {badge.earned && (
                      <div className="absolute -top-2 -right-2">
                        <CheckCircle className="h-6 w-6 text-green-500 bg-white rounded-full" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Challenges Tab */}
        <TabsContent value="challenges">
          <Card>
            <CardHeader>
              <CardTitle>Desafios Ativos</CardTitle>
              <CardDescription>
                Complete desafios para ganhar pontos extras
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="rounded-lg border p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-primary" />
                          <h3 className="font-semibold">{challenge.name}</h3>
                          <Badge variant="secondary">
                            {getChallengeTypeLabel(challenge.type as any)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {challenge.description}
                        </p>
                        <div className="mt-3 space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>{challenge.current}/{challenge.target}</span>
                            <span>{challenge.progress}%</span>
                          </div>
                          <Progress value={challenge.progress} className="h-2" />
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="flex items-center gap-1 text-lg font-bold text-primary">
                          <Zap className="h-4 w-4" />
                          +{challenge.reward}
                        </div>
                        <p className="text-xs text-muted-foreground">pontos</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards">
          <Card>
            <CardHeader>
              <CardTitle>Loja de Recompensas</CardTitle>
              <CardDescription>
                Troque seus pontos por recompensas exclusivas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 p-4 bg-primary/10 rounded-lg flex items-center justify-between">
                <span className="font-medium">Seus pontos disponiveis:</span>
                <span className="text-2xl font-bold text-primary">
                  {stats.availablePoints} pts
                </span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {mockRewards.map((reward) => (
                  <div
                    key={reward.id}
                    className={`rounded-lg border p-4 transition-all ${
                      reward.available && stats.availablePoints >= reward.cost
                        ? 'hover:shadow-md cursor-pointer'
                        : 'opacity-60'
                    }`}
                  >
                    <div className="text-center">
                      <Gift className="h-8 w-8 mx-auto text-primary mb-2" />
                      <h3 className="font-semibold">{reward.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {reward.description}
                      </p>
                      <Badge variant="outline" className="mt-2">
                        {getRewardTypeLabel(reward.type as any)}
                      </Badge>
                      <div className="mt-4">
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={!reward.available || stats.availablePoints < reward.cost}
                        >
                          <Zap className="mr-1 h-3 w-3" />
                          {reward.cost} pts
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Ranking Mensal</CardTitle>
              <CardDescription>
                Veja sua posicao em relacao aos outros pacientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockLeaderboard.map((user, index) => (
                  <div
                    key={user.rank}
                    className={`flex items-center justify-between rounded-lg border p-3 ${
                      (user as any).isCurrentUser ? 'bg-primary/10 border-primary' : ''
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                        index === 0 ? 'bg-yellow-100 text-yellow-700' :
                        index === 1 ? 'bg-gray-100 text-gray-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : user.rank}
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {user.name}
                          {(user as any).isCurrentUser && (
                            <Badge className="ml-2" variant="secondary">Voce</Badge>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Nivel {user.level} • {user.badges} badges
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{user.points.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">pontos</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
