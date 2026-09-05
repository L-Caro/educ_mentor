import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';
import { DIFFICULTIES, type Difficulty } from '../../../common/difficulty';

const OPERATIONS = ['addition', 'soustraction', 'multiplication'] as const;

export class StartPoseSessionDto {
  /** La difficulté commande l'échafaudage des retenues, pas la taille des nombres :
   *  facile = affichées et remplies, moyen = à remplir, difficile = absentes. */
  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: Difficulty;

  @IsOptional()
  @IsArray()
  @IsIn(OPERATIONS, { each: true })
  operations?: (typeof OPERATIONS)[number][];
}

export class RecordPoseAnswerDto {
  @IsString()
  skill_key: string;

  @IsBoolean()
  is_correct: boolean;
}

export class CompletePoseSessionDto {
  @IsInt()
  correct_answers: number;

  @IsInt()
  total_questions: number;
}

export class UpdateActiveOperationsDto {
  @IsArray()
  @IsString({ each: true })
  keys: string[];
}
