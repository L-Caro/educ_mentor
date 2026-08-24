import {
  IsBoolean,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DIFFICULTIES, type Difficulty } from '../../../common/difficulty';

export class CreateWordDto {
  @IsString()
  fr: string;

  @IsString()
  en: string;

  @IsString()
  category: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateWordDto {
  @IsOptional()
  @IsString()
  fr?: string;

  @IsOptional()
  @IsString()
  en?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  subcategory?: string;

  @IsOptional()
  @IsString()
  image_filename?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class StartSessionDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string' ? value.split(',').filter(Boolean) : value,
  )
  categories?: string[];

  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: Difficulty;

  // Sens de traduction = choix de pré-jeu enfant.
  @IsOptional()
  @IsIn(['fr_to_en', 'en_to_fr', 'random'])
  mode?: string;
}

export class RecordAnswerDto {
  @IsString()
  word_id: string;

  @IsBoolean()
  is_correct: boolean;
}

export class CompleteSessionDto {
  @IsNumber()
  correct_answers: number;

  @IsNumber()
  total_questions: number;
}

export class ImportJsonDto {
  @IsString()
  json: string;

  @IsOptional()
  @IsBoolean()
  overwrite?: boolean;
}
