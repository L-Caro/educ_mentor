import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { LONGUEURS, NIVEAUX } from '../dictee.logic';

export class StartDicteeSessionDto {
  @IsIn(NIVEAUX)
  niveau: string;

  @IsIn(LONGUEURS)
  longueur: string;

  /** Notion à travailler ; absente ou vide = toutes. */
  @IsOptional()
  @IsString()
  notion?: string;

  @IsOptional()
  @IsBoolean()
  preparee?: boolean;
}

export class CompleteDicteeSessionDto {
  /** Mots cochés comme ratés par l'enfant (forme brute ou clé, le serveur normalise). */
  @IsArray()
  @IsString({ each: true })
  wrongWords: string[];
}

export class ImportDicteeDto {
  @IsString()
  json: string;

  @IsOptional()
  @IsBoolean()
  replace?: boolean;

  @IsOptional()
  @IsBoolean()
  activate?: boolean;
}

export class CreateDicteeItemDto {
  @IsIn(NIVEAUX)
  niveau: string;

  @IsString()
  contenu: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notions?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateDicteeItemDto {
  @IsOptional()
  @IsIn(NIVEAUX)
  niveau?: string;

  @IsOptional()
  @IsString()
  contenu?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notions?: string[];

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
