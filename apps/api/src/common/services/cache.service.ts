import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redis: Redis;
  private isConnected = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');

      if (redisUrl) {
        this.redis = new Redis(redisUrl);
      } else {
        this.redis = new Redis({
          host: this.configService.get<string>('REDIS_HOST', 'localhost'),
          port: this.configService.get<number>('REDIS_PORT', 6379),
          password: this.configService.get<string>('REDIS_PASSWORD'),
          db: this.configService.get<number>('REDIS_DB', 0),
        });
      }

      this.redis.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Redis connected successfully');
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        this.logger.error(`Redis connection error: ${error.message}`);
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis connection closed');
      });
    } catch (error) {
      this.logger.error(`Failed to initialize Redis: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.redis) {
      await this.redis.quit();
      this.logger.log('Redis disconnected');
    }
  }

  /**
   * Obtém um valor do cache
   */
  async get<T = string>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, skipping get');
        return null;
      }

      const value = await this.redis.get(key);

      if (!value) {
        return null;
      }

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      this.logger.error(`Cache get error for key ${key}: ${error.message}`);
      return null;
    }
  }

  /**
   * Define um valor no cache
   * @param key Chave
   * @param value Valor (será serializado automaticamente)
   * @param ttl Tempo de vida em segundos (opcional)
   */
  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, skipping set');
        return false;
      }

      const serializedValue = typeof value === 'string'
        ? value
        : JSON.stringify(value);

      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }

      return true;
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Remove um valor do cache
   */
  async del(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        this.logger.warn('Redis not connected, skipping del');
        return false;
      }

      await this.redis.del(key);
      return true;
    } catch (error) {
      this.logger.error(`Cache del error for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Remove múltiplas chaves por padrão
   */
  async delByPattern(pattern: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0;
      }

      const keys = await this.redis.keys(pattern);

      if (keys.length === 0) {
        return 0;
      }

      return await this.redis.del(...keys);
    } catch (error) {
      this.logger.error(`Cache delByPattern error for pattern ${pattern}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Verifica se uma chave existe
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache exists error for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Define o tempo de expiração de uma chave
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      await this.redis.expire(key, ttl);
      return true;
    } catch (error) {
      this.logger.error(`Cache expire error for key ${key}: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtém o TTL restante de uma chave
   */
  async ttl(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return -1;
      }

      return await this.redis.ttl(key);
    } catch (error) {
      this.logger.error(`Cache ttl error for key ${key}: ${error.message}`);
      return -1;
    }
  }

  /**
   * Incrementa um valor numérico
   */
  async incr(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0;
      }

      return await this.redis.incr(key);
    } catch (error) {
      this.logger.error(`Cache incr error for key ${key}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Decrementa um valor numérico
   */
  async decr(key: string): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0;
      }

      return await this.redis.decr(key);
    } catch (error) {
      this.logger.error(`Cache decr error for key ${key}: ${error.message}`);
      return 0;
    }
  }

  /**
   * Armazena em hash
   */
  async hset(key: string, field: string, value: any): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const serializedValue = typeof value === 'string'
        ? value
        : JSON.stringify(value);

      await this.redis.hset(key, field, serializedValue);
      return true;
    } catch (error) {
      this.logger.error(`Cache hset error: ${error.message}`);
      return false;
    }
  }

  /**
   * Obtém de hash
   */
  async hget<T = string>(key: string, field: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        return null;
      }

      const value = await this.redis.hget(key, field);

      if (!value) {
        return null;
      }

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as T;
      }
    } catch (error) {
      this.logger.error(`Cache hget error: ${error.message}`);
      return null;
    }
  }

  /**
   * Obtém todos os campos de um hash
   */
  async hgetall<T = Record<string, string>>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) {
        return null;
      }

      const result = await this.redis.hgetall(key);

      if (Object.keys(result).length === 0) {
        return null;
      }

      return result as T;
    } catch (error) {
      this.logger.error(`Cache hgetall error: ${error.message}`);
      return null;
    }
  }

  /**
   * Remove campo de hash
   */
  async hdel(key: string, field: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      await this.redis.hdel(key, field);
      return true;
    } catch (error) {
      this.logger.error(`Cache hdel error: ${error.message}`);
      return false;
    }
  }

  /**
   * Adiciona a um set
   */
  async sadd(key: string, ...members: string[]): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0;
      }

      return await this.redis.sadd(key, ...members);
    } catch (error) {
      this.logger.error(`Cache sadd error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Verifica se membro está no set
   */
  async sismember(key: string, member: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.redis.sismember(key, member);
      return result === 1;
    } catch (error) {
      this.logger.error(`Cache sismember error: ${error.message}`);
      return false;
    }
  }

  /**
   * Remove de um set
   */
  async srem(key: string, ...members: string[]): Promise<number> {
    try {
      if (!this.isConnected) {
        return 0;
      }

      return await this.redis.srem(key, ...members);
    } catch (error) {
      this.logger.error(`Cache srem error: ${error.message}`);
      return 0;
    }
  }

  /**
   * Obtém todos os membros de um set
   */
  async smembers(key: string): Promise<string[]> {
    try {
      if (!this.isConnected) {
        return [];
      }

      return await this.redis.smembers(key);
    } catch (error) {
      this.logger.error(`Cache smembers error: ${error.message}`);
      return [];
    }
  }

  /**
   * Limpa todo o cache (use com cuidado!)
   */
  async flushAll(): Promise<boolean> {
    try {
      if (!this.isConnected) {
        return false;
      }

      if (this.configService.get('NODE_ENV') === 'production') {
        this.logger.warn('flushAll blocked in production');
        return false;
      }

      await this.redis.flushall();
      this.logger.warn('Cache flushed');
      return true;
    } catch (error) {
      this.logger.error(`Cache flushAll error: ${error.message}`);
      return false;
    }
  }

  /**
   * Verifica se o Redis está conectado
   */
  isReady(): boolean {
    return this.isConnected;
  }
}
