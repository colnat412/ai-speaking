import {
  CreateDateColumn,
  UpdateDateColumn,
  Column,
  BaseEntity,
} from 'typeorm';
import { TrueFalseEnum } from '../config/enums/common.enum';

export abstract class BaseModel extends BaseEntity {
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp',
  })
  updatedAt: Date;

  @Column({
    name: 'is_del',
    default: 0,
    comment: '0 = active, 1 = deleted',
  })
  isDel: TrueFalseEnum;
}
