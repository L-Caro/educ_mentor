import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';
import { DIFFICULTIES, type Difficulty } from '../../../common/difficulty';

export class StartCalculSessionDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  operation_types?: string[];

  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: Difficulty;
}

export class RecordCalculAnswerDto {
  @IsNumber()
  answer_value: number;

  @IsBoolean()
  is_correct: boolean;
}

export class CompleteCalculSessionDto {
  @IsInt()
  correct_answers: number;

  @IsInt()
  total_questions: number;
}
