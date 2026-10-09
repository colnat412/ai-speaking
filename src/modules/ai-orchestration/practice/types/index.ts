import { PracticeLevelEnum } from '../../../../config/enums/ai-orchestration.enum';

export interface UserActor {
  kind: 'user';
  userId: string;
}
export interface GuestActor {
  kind: 'guest';
  guestId: string;
}
export type PracticeActor = UserActor | GuestActor;

export interface CreatePracticeSessionInput {
  topic: string;
  level: PracticeLevelEnum;
}

export interface PracticeSession {
  id: string;
  actor: PracticeActor;
  topic: string;
  level: PracticeLevelEnum;
  createdAt: string;
}
