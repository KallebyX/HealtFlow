import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UserRole } from '@/common/enums/user-role.enum';

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
  RecordActionDto,
  CreateReferralCodeDto,
  UseReferralCodeDto,
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

@ApiTags('Gamification')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  // ==================== Achievements ====================

  @Post('achievements')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar achievement' })
  @ApiResponse({ status: 201, description: 'Achievement criado' })
  async createAchievement(
    @Body() dto: CreateAchievementDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gamificationService.createAchievement(dto, userId);
  }

  @Get('achievements')
  @ApiOperation({ summary: 'Listar achievements' })
  @ApiResponse({ status: 200, description: 'Lista de achievements' })
  async findAllAchievements(@Query() query: AchievementQueryDto) {
    return this.gamificationService.findAllAchievements(query);
  }

  @Get('achievements/me')
  @ApiOperation({ summary: 'Meus achievements' })
  @ApiResponse({ status: 200, description: 'Achievements do usuário' })
  async getMyAchievements(
    @Query() query: UserAchievementsQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gamificationService.getUserAchievements(userId, query);
  }

  @Get('achievements/user/:userId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Achievements de um usuário' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  async getUserAchievements(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query() query: UserAchievementsQueryDto,
  ) {
    return this.gamificationService.getUserAchievements(userId, query);
  }

  @Post('achievements/:code/unlock')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Desbloquear achievement manualmente' })
  @ApiParam({ name: 'code', description: 'Código do achievement' })
  async unlockAchievement(
    @Param('code') code: string,
    @Body() body: { userId: string },
  ) {
    return this.gamificationService.unlockAchievement(body.userId, code);
  }

  // ==================== Challenges ====================

  @Post('challenges')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar desafio' })
  @ApiResponse({ status: 201, description: 'Desafio criado' })
  async createChallenge(
    @Body() dto: CreateChallengeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gamificationService.createChallenge(dto, userId);
  }

  @Get('challenges')
  @ApiOperation({ summary: 'Listar desafios' })
  @ApiResponse({ status: 200, description: 'Lista de desafios' })
  async findAllChallenges(
    @Query() query: ChallengeQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gamificationService.findAllChallenges(query, userId);
  }

  @Post('challenges/join')
  @ApiOperation({ summary: 'Participar de um desafio' })
  @ApiResponse({ status: 200, description: 'Participação confirmada' })
  async joinChallenge(
    @Body() dto: JoinChallengeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gamificationService.joinChallenge(dto, userId);
  }

  @Post('challenges/progress')
  @ApiOperation({ summary: 'Atualizar progresso no desafio' })
  @ApiResponse({ status: 200, description: 'Progresso atualizado' })
  async updateChallengeProgress(
    @Body() dto: UpdateChallengeProgressDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gamificationService.updateChallengeProgress(dto, userId);
  }

  @Get('challenges/:id/leaderboard')
  @ApiOperation({ summary: 'Leaderboard do desafio' })
  @ApiParam({ name: 'id', description: 'ID do desafio' })
  async getChallengeLeaderboard(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limit') limit?: number,
  ) {
    return this.gamificationService.getChallengeLeaderboard(id, limit);
  }

  // ==================== Points ====================

  @Get('points/balance')
  @ApiOperation({ summary: 'Saldo de pontos' })
  @ApiResponse({ status: 200, description: 'Saldo atual' })
  async getPointsBalance(@CurrentUser('id') userId: string) {
    return this.gamificationService.getPointsBalance(userId);
  }

  @Get('points/history')
  @ApiOperation({ summary: 'Histórico de pontos' })
  @ApiResponse({ status: 200, description: 'Histórico de transações' })
  async getPointsHistory(
    @Query() query: PointsHistoryQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gamificationService.getPointsHistory(userId, query);
  }

  @Post('points/grant')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Conceder pontos a usuário' })
  @ApiResponse({ status: 201, description: 'Pontos concedidos' })
  async grantPoints(@Body() dto: GrantPointsDto) {
    return this.gamificationService.grantPoints(dto);
  }

  @Post('points/deduct')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Deduzir pontos de usuário' })
  @ApiResponse({ status: 200, description: 'Pontos deduzidos' })
  async deductPoints(
    @Body() dto: DeductPointsDto,
    @CurrentUser('id') requesterId: string,
  ) {
    return this.gamificationService.deductPoints(dto, requesterId);
  }

  // ==================== Rewards ====================

  @Post('rewards')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Criar recompensa' })
  @ApiResponse({ status: 201, description: 'Recompensa criada' })
  async createReward(
    @Body() dto: CreateRewardDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gamificationService.createReward(dto, userId);
  }

  @Get('rewards')
  @ApiOperation({ summary: 'Listar recompensas' })
  @ApiResponse({ status: 200, description: 'Lista de recompensas' })
  async findAllRewards(
    @Query() query: RewardQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gamificationService.findAllRewards(query, userId);
  }

  @Post('rewards/redeem')
  @ApiOperation({ summary: 'Resgatar recompensa' })
  @ApiResponse({ status: 200, description: 'Recompensa resgatada' })
  async redeemReward(
    @Body() dto: RedeemRewardDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gamificationService.redeemReward(dto, userId);
  }

  @Get('rewards/my-redemptions')
  @ApiOperation({ summary: 'Meus resgates' })
  @ApiResponse({ status: 200, description: 'Lista de resgates' })
  async getMyRedemptions(
    @Query() query: MyRedemptionsQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gamificationService.getMyRedemptions(userId, query);
  }

  // ==================== Leaderboard ====================

  @Get('leaderboard')
  @ApiOperation({ summary: 'Leaderboard geral' })
  @ApiResponse({ status: 200, description: 'Ranking de usuários' })
  async getLeaderboard(
    @Query() query: LeaderboardQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gamificationService.getLeaderboard(query, userId);
  }

  // ==================== Streaks ====================

  @Get('streaks')
  @ApiOperation({ summary: 'Minhas sequências' })
  @ApiResponse({ status: 200, description: 'Sequências ativas' })
  async getStreaks(
    @Query() query: StreakQueryDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gamificationService.getStreaks(userId, query);
  }

  // ==================== Actions ====================

  @Post('actions/record')
  @ApiOperation({ summary: 'Registrar ação para gamificação' })
  @ApiResponse({ status: 200, description: 'Ação registrada' })
  async recordAction(
    @Body() dto: RecordActionDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gamificationService.recordAction(dto, userId);
  }

  // ==================== Referral ====================

  @Post('referral/create-code')
  @ApiOperation({ summary: 'Criar código de indicação' })
  @ApiResponse({ status: 201, description: 'Código criado' })
  async createReferralCode(
    @Body() dto: CreateReferralCodeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gamificationService.createReferralCode(dto, userId);
  }

  @Post('referral/use-code')
  @ApiOperation({ summary: 'Usar código de indicação' })
  @ApiResponse({ status: 200, description: 'Código aplicado' })
  async useReferralCode(
    @Body() dto: UseReferralCodeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.gamificationService.useReferralCode(dto, userId);
  }

  // ==================== Profile/Dashboard ====================

  @Get('profile')
  @ApiOperation({ summary: 'Perfil de gamificação' })
  @ApiResponse({ status: 200, description: 'Perfil do usuário' })
  async getProfile(@CurrentUser('id') userId: string) {
    return this.gamificationService.getProfile(userId);
  }

  @Get('profile/:userId')
  @Roles(UserRole.ADMIN, UserRole.DOCTOR)
  @ApiOperation({ summary: 'Perfil de gamificação de um usuário' })
  @ApiParam({ name: 'userId', description: 'ID do usuário' })
  async getUserProfile(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.gamificationService.getProfile(userId);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard de gamificação' })
  @ApiResponse({ status: 200, description: 'Dashboard completo' })
  async getDashboard(@CurrentUser('id') userId: string) {
    return this.gamificationService.getDashboard(userId);
  }

  // ==================== Statistics ====================

  @Get('statistics')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Estatísticas de gamificação' })
  @ApiResponse({ status: 200, description: 'Estatísticas gerais' })
  async getStatistics(@Query() query: GamificationStatsQueryDto) {
    return this.gamificationService.getStatistics(query);
  }
}
