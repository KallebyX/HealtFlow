import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { AuditAction } from '@prisma/client';

export interface AuditLogParams {
  action: AuditAction;
  resource: string;
  resourceId?: string;
  userId?: string;
  performedBy?: string;
  description?: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditQueryParams {
  userId?: string;
  resource?: string;
  action?: AuditAction;
  resourceId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra um log de auditoria
   */
  async log(params: AuditLogParams): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          userId: params.userId,
          performedBy: params.performedBy || params.userId,
          description: params.description,
          oldData: params.oldData as any,
          newData: params.newData as any,
          metadata: params.metadata as any,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });

      this.logger.debug(
        `Audit log: ${params.action} on ${params.resource} by ${params.userId || 'system'}`,
      );
    } catch (error) {
      // Não deixar falha de auditoria quebrar a operação principal
      this.logger.error(`Failed to create audit log: ${error.message}`);
    }
  }

  /**
   * Registra criação de recurso
   */
  async logCreate(
    resource: string,
    resourceId: string,
    userId: string,
    newData?: Record<string, unknown>,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      action: AuditAction.CREATE,
      resource,
      resourceId,
      userId,
      newData,
      metadata,
      description: `${resource} criado`,
    });
  }

  /**
   * Registra leitura de recurso
   */
  async logRead(
    resource: string,
    resourceId: string,
    userId: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      action: AuditAction.READ,
      resource,
      resourceId,
      userId,
      metadata,
      description: `${resource} visualizado`,
    });
  }

  /**
   * Registra atualização de recurso
   */
  async logUpdate(
    resource: string,
    resourceId: string,
    userId: string,
    oldData?: Record<string, unknown>,
    newData?: Record<string, unknown>,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      action: AuditAction.UPDATE,
      resource,
      resourceId,
      userId,
      oldData,
      newData,
      metadata,
      description: `${resource} atualizado`,
    });
  }

  /**
   * Registra exclusão de recurso
   */
  async logDelete(
    resource: string,
    resourceId: string,
    userId: string,
    oldData?: Record<string, unknown>,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      action: AuditAction.DELETE,
      resource,
      resourceId,
      userId,
      oldData,
      metadata,
      description: `${resource} excluído`,
    });
  }

  /**
   * Registra login
   */
  async logLogin(
    userId: string,
    ipAddress?: string,
    userAgent?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      action: AuditAction.LOGIN,
      resource: 'user',
      resourceId: userId,
      userId,
      ipAddress,
      userAgent,
      metadata,
      description: 'Login realizado',
    });
  }

  /**
   * Registra logout
   */
  async logLogout(
    userId: string,
    ipAddress?: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      action: AuditAction.LOGOUT,
      resource: 'user',
      resourceId: userId,
      userId,
      ipAddress,
      metadata,
      description: 'Logout realizado',
    });
  }

  /**
   * Registra exportação de dados
   */
  async logExport(
    resource: string,
    userId: string,
    format: string,
    recordCount: number,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      action: AuditAction.EXPORT,
      resource,
      userId,
      metadata: {
        ...metadata,
        format,
        recordCount,
      },
      description: `${resource} exportado (${recordCount} registros, formato ${format})`,
    });
  }

  /**
   * Registra assinatura digital
   */
  async logSign(
    resource: string,
    resourceId: string,
    userId: string,
    signatureInfo: Record<string, unknown>,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      action: AuditAction.SIGN,
      resource,
      resourceId,
      userId,
      metadata: {
        ...metadata,
        ...signatureInfo,
      },
      description: `${resource} assinado digitalmente`,
    });
  }

  /**
   * Registra verificação de assinatura
   */
  async logVerify(
    resource: string,
    resourceId: string,
    userId: string,
    verificationResult: boolean,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      action: AuditAction.VERIFY,
      resource,
      resourceId,
      userId,
      metadata: {
        ...metadata,
        verificationResult,
      },
      description: `${resource} verificado (${verificationResult ? 'válido' : 'inválido'})`,
    });
  }

  /**
   * Registra acesso a dados sensíveis
   */
  async logAccess(
    resource: string,
    resourceId: string,
    userId: string,
    accessType: string,
    metadata?: Record<string, unknown>,
  ): Promise<void> {
    await this.log({
      action: AuditAction.ACCESS,
      resource,
      resourceId,
      userId,
      metadata: {
        ...metadata,
        accessType,
      },
      description: `Acesso a ${resource} (${accessType})`,
    });
  }

  /**
   * Busca logs de auditoria
   */
  async findLogs(params: AuditQueryParams) {
    const {
      userId,
      resource,
      action,
      resourceId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = params;

    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

    if (resource) {
      where.resource = resource;
    }

    if (action) {
      where.action = action;
    }

    if (resourceId) {
      where.resourceId = resourceId;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Busca logs de um usuário específico
   */
  async findByUser(userId: string, params?: Omit<AuditQueryParams, 'userId'>) {
    return this.findLogs({ ...params, userId });
  }

  /**
   * Busca logs de um recurso específico
   */
  async findByResource(
    resource: string,
    resourceId: string,
    params?: Omit<AuditQueryParams, 'resource' | 'resourceId'>,
  ) {
    return this.findLogs({ ...params, resource, resourceId });
  }

  /**
   * Obtém estatísticas de auditoria
   */
  async getStatistics(startDate?: Date, endDate?: Date) {
    const where: any = {};

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    const [totalLogs, byAction, byResource] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.groupBy({
        by: ['action'],
        where,
        _count: { action: true },
      }),
      this.prisma.auditLog.groupBy({
        by: ['resource'],
        where,
        _count: { resource: true },
      }),
    ]);

    return {
      totalLogs,
      byAction: byAction.map((item) => ({
        action: item.action,
        count: item._count.action,
      })),
      byResource: byResource.map((item) => ({
        resource: item.resource,
        count: item._count.resource,
      })),
    };
  }

  /**
   * Limpa logs antigos (para manutenção)
   */
  async cleanOldLogs(retentionDays: number): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const result = await this.prisma.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    this.logger.log(`Cleaned ${result.count} audit logs older than ${retentionDays} days`);

    return result.count;
  }
}
