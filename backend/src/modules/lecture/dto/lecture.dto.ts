import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class StartLectureSessionDto {
  @IsInt() @Min(1) @Type(() => Number)
  textId: number;

  @IsOptional() @IsString()
  difficulty?: string;
}

export class RecordLectureAnswerDto {
  @IsString() @IsNotEmpty()
  itemKey: string;

  @IsBoolean()
  isCorrect: boolean;
}

export class CompleteLectureSessionDto {
  @IsInt() @Min(0) @Type(() => Number)
  correctAnswers: number;

  @IsInt() @Min(0) @Type(() => Number)
  totalQuestions: number;
}

export class CreateTextDto {
  @IsString() @IsNotEmpty()
  titre: string;

  @IsString() @IsNotEmpty()
  contenu: string;

  @IsOptional() @IsBoolean()
  actif?: boolean;
}

export class UpdateTextDto {
  @IsOptional() @IsString() @IsNotEmpty()
  titre?: string;

  @IsOptional() @IsString() @IsNotEmpty()
  contenu?: string;

  @IsOptional() @IsBoolean()
  actif?: boolean;
}

export class CreateQuestionDto {
  @IsString() @IsNotEmpty()
  question: string;

  @IsString() @IsNotEmpty()
  answer: string;

  @IsString({ each: true })
  distractors: string[];

  @IsOptional() @IsString()
  excerpt?: string;

  @IsOptional() @IsInt() @Type(() => Number)
  ordre?: number;
}

export class UpdateQuestionDto {
  @IsOptional() @IsString() @IsNotEmpty()
  question?: string;

  @IsOptional() @IsString() @IsNotEmpty()
  answer?: string;

  @IsOptional() @IsString({ each: true })
  distractors?: string[];

  @IsOptional() @IsString()
  excerpt?: string;

  @IsOptional() @IsInt() @Type(() => Number)
  ordre?: number;
}