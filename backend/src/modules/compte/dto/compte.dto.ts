import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { DIFFICULTIES, type Difficulty } from '../../../common/difficulty';
import { OPERATIONS } from '../compte.generator';

export class StartCompteSessionDto {
  /** La difficulté commande le NOMBRE D'OPÉRATIONS à enchaîner, pas la taille des
   *  nombres : c'est la longueur de la chaîne qui fait la recherche. */
  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: Difficulty;

  @IsOptional()
  @IsArray()
  @IsIn(OPERATIONS, { each: true })
  operations?: string[];
}

export class RecordCompteAnswerDto {
  @IsString()
  skill_key: string;

  @IsBoolean()
  is_correct: boolean;
}

export class CompleteCompteSessionDto {
  @IsInt()
  correct_answers: number;

  @IsInt()
  total_questions: number;
}

export class UpdateActiveCompteOperationsDto {
  @IsArray()
  @IsString({ each: true })
  keys: string[];
}
