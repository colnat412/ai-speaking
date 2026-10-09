import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseModel } from '../../../../base/base.entity';
import { UserEntity } from '../../../users/entities/user.entity';
import { PracticeLevelEnum } from '../../../../config/enums/ai-orchestration.enum';

@Entity('practice_sessions')
export class PracticeSessionEntity extends BaseModel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: string;

  @ManyToOne(() => UserEntity, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user?: UserEntity;

  @Column({ type: 'varchar', length: 200 })
  topic: string;

  @Column({ type: 'enum', enum: PracticeLevelEnum })
  level: PracticeLevelEnum;
}
