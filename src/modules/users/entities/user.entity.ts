import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { UserStatusEnum } from '../../../config/enums/user.enum';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column()
  email: string;

  @Column({ name: 'password', nullable: true })
  password: string;

  @Column()
  name: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column()
  status: UserStatusEnum;
}
