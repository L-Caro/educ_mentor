import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { DIFFICULTIES, type Difficulty } from '../../../common/difficulty';

const VALID_DIRECTIONS = ['forward', 'reverse', 'random'] as const;
export type QuestionDirection = (typeof VALID_DIRECTIONS)[number];

export class StartConjugaisonSessionDto {
  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: Difficulty;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tenses?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  verb_groups?: string[];

  @IsOptional()
  @IsIn(VALID_DIRECTIONS)
  question_direction?: QuestionDirection;
}

export class RecordConjugaisonAnswerDto {
  @IsString()
  verb_tense: string;

  @IsBoolean()
  is_correct: boolean;
}

export class CompleteConjugaisonSessionDto {
  @IsInt()
  correct_answers: number;

  @IsInt()
  total_questions: number;
}

export class UpdateActiveTensesDto {
  @IsArray()
  @IsString({ each: true })
  keys: string[];
}
