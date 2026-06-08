import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class StartTablesSessionDto {
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(10, { each: true })
  @Transform(({ value }) =>
    typeof value === 'string'
      ? value.split(',').map(Number).filter((n) => !isNaN(n))
      : value,
  )
  selected_tables: number[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  count?: number;

  // 0 = saisie libre, 2 ou 4 = QCM
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(4)
  choices_count?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  exclude_trivial?: boolean;
}

export class RecordTablesAnswerDto {
  @IsInt()
  @Min(0)
  @Max(10)
  factor_a: number;

  @IsInt()
  @Min(0)
  @Max(10)
  factor_b: number;

  @IsBoolean()
  is_correct: boolean;
}

export class CompleteTablesSessionDto {
  @IsNumber()
  correct_answers: number;

  @IsNumber()
  total_questions: number;
}
