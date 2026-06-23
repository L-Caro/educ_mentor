import { IsBoolean, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { DIFFICULTIES, type Difficulty } from '../../../common/difficulty';

export class StartHeureSessionDto {
  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: Difficulty;

  @IsOptional()
  @IsString()
  numeral_type?: string;

  @IsOptional()
  @IsIn(['digital', 'expression'])
  question_mode?: 'digital' | 'expression';
}

export class RecordHeureAnswerDto {
  @IsInt()
  answer_value: number;

  @IsBoolean()
  is_correct: boolean;
}

export class CompleteHeureSessionDto {
  @IsInt()
  correct_answers: number;

  @IsInt()
  total_questions: number;
}