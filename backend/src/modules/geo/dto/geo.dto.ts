import { IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { DIFFICULTIES, type Difficulty } from '../../../common/difficulty';

const VALID_DIRECTIONS = ['forward', 'reverse', 'random'] as const;
export type CapitalDirection = typeof VALID_DIRECTIONS[number];

export const ALL_QUESTION_TYPES = [
  'country_to_capital',
  'capital_to_country',
  'country_to_continent',
  'country_to_ocean',
  'flag_to_country',
  'country_to_flag',
  'odd_one_out',
  'country_to_language',
  'select_oceans',
  'select_continent_countries',
  'country_borders',
  'select_language_countries',
  'identify_country',
] as const;

export type GeoQuestionType = typeof ALL_QUESTION_TYPES[number];

export class StartGeoSessionDto {
  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: Difficulty;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  question_types?: GeoQuestionType[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  continents?: string[];

  @IsOptional()
  @IsIn(VALID_DIRECTIONS)
  capital_direction?: CapitalDirection;
}

export class RecordGeoAnswerDto {
  @IsString()
  item_key: string;

  @IsBoolean()
  is_correct: boolean;
}

export class CompleteGeoSessionDto {
  @IsInt()
  correct_answers: number;

  @IsInt()
  total_questions: number;
}