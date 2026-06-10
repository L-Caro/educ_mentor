import { IsArray, IsBoolean, IsInt, IsNumber, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

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
