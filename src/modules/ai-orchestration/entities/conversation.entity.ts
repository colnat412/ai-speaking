import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { BaseModel } from '../../../base/base.entity';

@Entity('conversations')
export class ConversationEntity extends BaseModel {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @Column({ name: 'user_text', type: 'text' })
  userText: string;

  @Column({ name: 'ai_response', type: 'text' })
  aiResponse: string;

  @Column({ name: 'grammar_correction', type: 'text', nullable: true })
  grammarCorrection: string;
}
