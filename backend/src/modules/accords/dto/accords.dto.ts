import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { DIFFICULTIES, type Difficulty } from '../../../common/difficulty';
import { QUESTION_TYPES, type QuestionType } from '../accords.logic';
import { NOTION_KEYS, type NotionKey } from '../accords.notions';

export class StartAccordsSessionDto {
  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: Difficulty;

  @IsOptional()
  @IsArray()
  @IsIn(QUESTION_TYPES, { each: true })
  question_types?: QuestionType[];
}

export class RecordAccordsAnswerDto {
  @IsString()
  skill_key: string;

  @IsBoolean()
  is_correct: boolean;
}

export class CompleteAccordsSessionDto {
  @IsInt()
  correct_answers: number;

  @IsInt()
  total_questions: number;
}

export class UpdateActiveNotionsDto {
  @IsArray()
  @IsIn(NOTION_KEYS, { each: true })
  keys: NotionKey[];
}

export class UpdateActiveFamillesDto {
  @IsArray()
  @IsString({ each: true })
  keys: string[];
}
