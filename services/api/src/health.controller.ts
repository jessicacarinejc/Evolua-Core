import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Controller('health')
export class HealthController {
  constructor(private readonly db: DatabaseService) {}

  @Get()
  status() {
    return {
      service: 'evolua-core-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async ready() {
    const startedAt = Date.now();
    try {
      const result = await this.db.query<{ ok: number }>('SELECT 1 AS ok');
      return {
        service: 'evolua-core-api',
        status: result.rows[0]?.ok === 1 ? 'ready' : 'degraded',
        database: 'ok',
        latencyMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        service: 'evolua-core-api',
        status: 'not_ready',
        database: 'unavailable',
        timestamp: new Date().toISOString(),
      });
    }
  }
}
