import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';
import { NIVEAUX } from '../dictee.logic';

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
