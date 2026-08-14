import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const requestLogger = new Logger('HTTP');

  app.setGlobalPrefix('v1');
  app.enableCors({ origin: true, credentials: true });
  app.use((req: any, res: any, next: () => void) => {
    const startedAt = Date.now();
    const requestIdHeader = typeof req.headers?.['x-request-id'] === 'string'
      ? req.headers['x-request-id'].slice(0, 64)
      : null;
    const requestId = requestIdHeader || randomUUID();
    const method = String(req.method ?? 'UNKNOWN');
    const path = String(req.originalUrl ?? req.url ?? '/').split('?')[0];

    res.setHeader('x-request-id', requestId);
    res.on('finish', () => {
      requestLogger.log(JSON.stringify({
        requestId,
        method,
        path,
        statusCode: Number(res.statusCode ?? 0),
        durationMs: Date.now() - startedAt,
      }));
    });

    next();
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.API_PORT ?? 3333);
  await app.listen(port, '0.0.0.0');

  Logger.log(`Evolua Core API disponível na porta ${port}`, 'Bootstrap');
}

void bootstrap();
