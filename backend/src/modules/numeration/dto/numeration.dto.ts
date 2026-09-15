import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class StartNumerationSessionDto {
  /** Restreindre les positions pour CETTE demande, sans toucher au reglage permanent :
   * une feuille peut s'arreter aux milliers alors que le module va plus loin. */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  positions?: string[];

  @IsArray()
  @IsOptional()
  question_types?: string[];
}

export class CompleteNumerationSessionDto {
  @IsNumber() correctAnswers: number;
  @IsNumber() totalQuestions: number;
}

export class RecordNumerationAnswerDto {
  @IsString() itemKey: string;
  @IsBoolean() isCorrect: boolean;
}
