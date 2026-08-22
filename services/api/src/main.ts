import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './common/filters/api-exception.filter.js';
import { validateServerEnvironment } from './config/environment.js';
import { configureRuntimeHardening } from './common/runtime/runtime-hardening.js';

async function bootstrap() {
  const environment = validateServerEnvironment();
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ bodyLimit: environment.bodyLimitBytes, trustProxy: environment.trustProxy ? 1 : false, requestTimeout: environment.requestTimeoutMs }));
  app.setGlobalPrefix('api/v1');
  configureRuntimeHardening(app,environment);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableShutdownHooks(['SIGTERM','SIGINT']);
  await app.listen({ host: environment.host, port: environment.port });
}

void bootstrap().catch(error=>{process.stderr.write(JSON.stringify({timestamp:new Date().toISOString(),level:'fatal',event:'api.bootstrap_failed',code:error instanceof Error&&'code'in error?String(error.code):'BOOTSTRAP_FAILED',message:error instanceof Error?error.message:'API bootstrap failed'})+'\n');process.exitCode=1;});
