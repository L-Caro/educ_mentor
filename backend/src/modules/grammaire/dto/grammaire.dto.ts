import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { DIFFICULTIES, type Difficulty } from '../../../common/difficulty';
import { QUESTION_TYPES, type QuestionType } from '../grammaire.logic';
import { NOTION_KEYS, type NotionKey } from '../grammaire.notions';

export class StartGrammaireSessionDto {
  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: Difficulty;

  @IsOptional()
  @IsArray()
  @IsIn(QUESTION_TYPES, { each: true })
  question_types?: QuestionType[];
}

export class RecordGrammaireAnswerDto {
  @IsString()
  skill_key: string;

  @IsBoolean()
  is_correct: boolean;
}

export class CompleteGrammaireSessionDto {
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
