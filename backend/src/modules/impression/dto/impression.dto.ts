import {
  IsArray,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LigneCompositionDto {
  @IsString()
  module: string;

  /** Les types coches. Les exercices sont repartis entre eux (voir `ImpressionService`). */
  @IsArray()
  @IsString({ each: true })
  exercices: string[];

  /** Borne haute par ligne. Le total est verifie a part, mais une ligne demesuree ne doit
   * meme pas atteindre le service. */
  @IsInt()
  @Min(1)
  @Max(60)
  nombre: number;

  @IsOptional()
  @IsObject()
  options?: Record<string, unknown>;
}

export class ComposerFeuilleDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneCompositionDto)
  lignes: LigneCompositionDto[];
}
