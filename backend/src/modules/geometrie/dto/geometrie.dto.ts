import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { DIFFICULTIES, type Difficulty } from '../../../common/difficulty';
import { QUESTION_TYPES, type QuestionType } from '../geometrie.logic';

export class StartGeometrieSessionDto {
  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: Difficulty;

  @IsOptional()
  @IsArray()
  @IsIn(QUESTION_TYPES, { each: true })
  question_types?: QuestionType[];
}

export class RecordGeometrieAnswerDto {
  @IsString()
  skill_key: string;

  @IsBoolean()
  is_correct: boolean;
}

export class CompleteGeometrieSessionDto {
  @IsInt()
  correct_answers: number;

  @IsInt()
  total_questions: number;
}

export class UpdateActiveShapesDto {
  @IsArray()
  @IsString({ each: true })
  keys: string[];
}
