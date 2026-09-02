import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../integrations/supabase/supabase.module.js';
import { AuthGuard } from '../../common/guards/auth.guard.js';
import { TenantGuard } from '../../common/guards/tenant.guard.js';
import { PermissionGuard } from '../../common/guards/permission.guard.js';
import { DashboardController } from './dashboard.controller.js';
import { DashboardService } from './dashboard.service.js';

@Module({
  imports: [SupabaseModule],
  controllers: [DashboardController],
  providers: [DashboardService, AuthGuard, TenantGuard, PermissionGuard],
})
export class DashboardModule {}
