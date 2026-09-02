import assert from 'node:assert/strict';
import test from 'node:test';
import { Module, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from '../src/app.module.js';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter.js';
import { SupabaseModule } from '../src/integrations/supabase/supabase.module.js';
import { AuthController } from '../src/modules/auth/auth.controller.js';
import { AuthModule } from '../src/modules/auth/auth.module.js';
import { AuthService } from '../src/modules/auth/auth.service.js';

@Module({ imports: [SupabaseModule, AuthModule] })
class AuthDiTestModule {}

const testEnvironment = {
  SUPABASE_URL: 'https://example.supabase.co',
  SUPABASE_ANON_KEY: 'test-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key',
};

function installTestEnvironment() {
  const previous = new Map<string, string | undefined>();
  for (const [name, value] of Object.entries(testEnvironment)) {
    previous.set(name, process.env[name]);
    process.env[name] = value;
  }
  return () => {
    for (const [name, value] of previous) {
      if (value === undefined) delete process.env[name];
      else process.env[name] = value;
    }
  };
}

function mockRecoveryBoundary(service: AuthService) {
  const internal = service as unknown as {
    supabase: {
      authClient: {
        auth: { resetPasswordForEmail: (email: string) => Promise<unknown> };
      };
    };
  };
  internal.supabase.authClient.auth.resetPasswordForEmail = async () => ({
    data: {},
    error: null,
  });
}

test('AuthModule DI resolves controller and service and reaches forgot-password service', async () => {
  const restore = installTestEnvironment();
  const context = await NestFactory.createApplicationContext(AuthDiTestModule, {
    logger: false,
  });
  try {
    const controller = context.get(AuthController);
    const service = context.get(AuthService);
    assert.ok(controller);
    assert.ok(service);
    mockRecoveryBoundary(service);

    let reached = false;
    const original = service.forgotPassword.bind(service);
    service.forgotPassword = async (...args) => {
      reached = true;
      return original(...args);
    };

    const result = await controller.forgot(
      { email: 'owner@example.com' },
      'di-controller-test',
    );
    assert.equal(result.accepted, true);
    assert.equal(reached, true);
  } finally {
    await context.close();
    restore();
  }
});

test('real AppModule bootstrap registers health and forgot-password routes without external email', async () => {
  const restore = installTestEnvironment();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
    { logger: false },
  );
  try {
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
    mockRecoveryBoundary(app.get(AuthService));

    const health = await app.inject({ method: 'GET', url: '/api/v1/health' });
    assert.equal(health.statusCode, 200);

    const forgot = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/forgot-password',
      headers: { 'x-request-id': 'bootstrap-route-test' },
      payload: { email: 'owner@example.com' },
    });
    assert.equal(forgot.statusCode, 201);
    assert.equal(forgot.json().accepted, true);
  } finally {
    await app.close();
    restore();
  }
});
