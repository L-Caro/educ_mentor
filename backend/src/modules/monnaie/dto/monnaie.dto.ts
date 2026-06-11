import { IsBoolean, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { DIFFICULTIES, type Difficulty } from '../../../common/difficulty';

export class StartMonnaieSessionDto {
  @IsString()
  exercise_type: string;

  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: Difficulty;
}

export class RecordMonnaieAnswerDto {
  @IsString()
  exercise_type: string;

  @IsInt()
  answer_value: number;

  @IsBoolean()
  is_correct: boolean;
}

export class CompleteMonnaieSessionDto {
  @IsInt()
  correct_answers: number;

  @IsInt()
  total_questions: number;
}
