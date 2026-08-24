import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

const PENDU_DIFFICULTIES = ['easy', 'normal', 'hard'] as const;
const WORD_LENGTHS = ['any', 'short', 'medium', 'long'] as const;

export class StartPenduSessionDto {
  @IsIn(PENDU_DIFFICULTIES)
  difficulty: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3)
  letters_revealed?: number;

  @IsOptional()
  @IsIn(WORD_LENGTHS)
  word_length?: string;
}

export class CompletePenduSessionDto {
  @IsBoolean()
  won: boolean;
}

export class CreatePenduWordDto {
  @IsString()
  @IsNotEmpty()
  word: string;

  @IsIn(PENDU_DIFFICULTIES)
  difficulty: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdatePenduWordDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  word?: string;

  @IsOptional()
  @IsIn(PENDU_DIFFICULTIES)
  difficulty?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
