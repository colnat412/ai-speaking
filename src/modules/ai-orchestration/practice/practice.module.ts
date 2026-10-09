import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from '../../../common/redis/redis.module';
import { HashidsModule } from '../../../common/hashids/hashids.module';
import { PracticeSessionEntity } from './entities/practice-session.entity';
import { PracticeActorService } from './practice-actor.service';
import { PracticeSessionService } from './practice-session.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([PracticeSessionEntity]),
    RedisModule,
    HashidsModule,
  ],
  providers: [PracticeActorService, PracticeSessionService],
  exports: [PracticeSessionService, PracticeActorService],
})
export class PracticeModule {}
