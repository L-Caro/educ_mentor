import { IsBoolean, IsInt, IsString } from 'class-validator';

export class StartMonnaieSessionDto {
  @IsString()
  exercise_type: string;
}

export class RecordMonnaieAnswerDto {
  @IsString()
  exercise_type: string;

  @IsInt()
  answer_value: number;

  @IsBoolean()
  is_correct: boolean;
}

export class CompleteMonnaieSessionDto {
  @IsInt()
  correct_answers: number;

  @IsInt()
  total_questions: number;
}
