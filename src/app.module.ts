import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppModules } from './config/modules';
import { PostgresModule } from './databases/postgres/postgres.module';
import { HttpLoggerMiddleware } from './common/middlewares/app.middleware';
import { RedisModule } from './common/redis/redis.module';
import { HashidsModule } from './common/hashids/hashids.module';

@Module({
  imports: [PostgresModule, RedisModule, HashidsModule, ...AppModules],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpLoggerMiddleware).forRoutes('*');
  }
}
