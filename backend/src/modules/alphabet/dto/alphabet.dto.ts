import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { DIFFICULTIES, type Difficulty } from '../../../common/difficulty';

/** Les trois facons de travailler l'ordre alphabetique. */
export const TYPES_ALPHABET = ['ranger', 'intrus', 'intercaler'] as const;
export type TypeAlphabet = (typeof TYPES_ALPHABET)[number];

export class StartAlphabetSessionDto {
  @IsOptional()
  @IsIn(DIFFICULTIES)
  difficulty?: Difficulty;

  @IsOptional()
  @IsString({ each: true })
  types?: string[];

  /** Le PLAFOND de lettres communes entre deux mots d'une meme question. Zero : ils
   * commencent tous par une lettre differente, il suffit de connaitre l'alphabet. Trois :
   * deux d'entre eux au moins se ressemblent sur trois lettres et ne se departagent qu'a
   * la quatrieme, ce qui est le vrai travail de dictionnaire. Les autres peuvent se
   * separer plus tot : c'est un maximum, pas une consigne. */
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(5)
  communes?: number;

  @IsOptional()
  @IsInt()
  @Min(4)
  @Max(20)
  combien?: number;
}

export class ExclureMotDto {
  @IsString()
  @MinLength(1)
  mot: string;
}
