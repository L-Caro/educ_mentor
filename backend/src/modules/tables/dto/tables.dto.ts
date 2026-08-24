import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DIFFICULTIES, type Difficulty } from '../../../common/difficulty';

export class StartTablesSessionDto {
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(10, { each: true })
  @Transform(({ value }: { value: unknown }): unknown =>
    typeof value === 'string'
      ? value
          .split(',')
          .map(Number)
          .filter((n) => !isNaN(n))
      : value,
  )
  selected_tables: number[];

  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: Difficulty;
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
