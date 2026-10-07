import { PostgresModule } from '../databases/postgres/postgres.module';
import { RedisModule } from '../common/redis/redis.module';
import { UsersModule } from '../modules/users/users.module';
import { AuthModule } from '../modules/auth/auth.module';
import { AiOrchestrationModule } from '../modules/ai-orchestration/ai-orchestration.module';

export const AppModules = [
  PostgresModule,
  RedisModule,
  UsersModule,
  AuthModule,
  AiOrchestrationModule,
];
