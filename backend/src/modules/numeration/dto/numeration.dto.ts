import { IsArray, IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class StartNumerationSessionDto {
  @IsArray() @IsOptional()
  question_types?: string[];
}

export class CompleteNumerationSessionDto {
  @IsNumber() correctAnswers: number;
  @IsNumber() totalQuestions: number;
}

export class RecordNumerationAnswerDto {
  @IsString()  itemKey:   string;
  @IsBoolean() isCorrect: boolean;
}