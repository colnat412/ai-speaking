import { IsEnum, IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { PracticeLevelEnum } from '../../../../config/enums/ai-orchestration.enum';

export class CreatePracticeSessionDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @Length(1, 200)
  topic: string;

  @IsEnum(PracticeLevelEnum)
  level: PracticeLevelEnum;
}
