import { IsBoolean, IsInt, IsNumber } from 'class-validator';

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
