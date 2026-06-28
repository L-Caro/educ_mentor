import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { DIFFICULTIES, type Difficulty } from '../../../common/difficulty';

export const ALL_FRANCE_QUESTION_TYPES = [
  'dept_to_number',
  'number_to_dept',
  'dept_to_prefecture',
  'prefecture_to_dept',
  'dept_to_region',
  'region_chef_lieu',
  'dept_borders',
  'dept_sub_prefectures',
  'region_depts',
  'region_old_names',
  'river_depts',
  'maritime_facade',
  'massif_summit',
  'summit_altitude',
  'dept_gentile',
] as const;

export type FranceQuestionType = typeof ALL_FRANCE_QUESTION_TYPES[number];

export class StartFranceSessionDto {
  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: Difficulty;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  question_types?: FranceQuestionType[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];
}

export class RecordFranceAnswerDto {
  @IsString()
  item_key: string;

  @IsBoolean()
  is_correct: boolean;
}

export class CompleteFranceSessionDto {
  @IsInt()
  correct_answers: number;

  @IsInt()
  total_questions: number;
}
