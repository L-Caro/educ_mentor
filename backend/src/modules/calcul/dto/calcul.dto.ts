import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString } from 'class-validator';

export class StartCalculSessionDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  operation_types?: string[];
}

export class RecordCalculAnswerDto {
  @IsNumber()
  answer_value: number;

  @IsBoolean()
  is_correct: boolean;
}

export class CompleteCalculSessionDto {
  @IsInt()
  correct_answers: number;

  @IsInt()
  total_questions: number;
}
