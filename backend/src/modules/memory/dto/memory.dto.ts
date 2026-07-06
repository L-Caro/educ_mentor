import { IsArray, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const MEMORY_MODES = ['image', 'image_word_fr', 'image_word_en'] as const;
export type MemoryMode = (typeof MEMORY_MODES)[number];

export class StartMemorySessionDto {
  @IsInt()
  @Min(2)
  @Max(28)
  pairs_count: number;

  @IsIn(MEMORY_MODES)
  mode: MemoryMode;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  categories?: string[];
}

export class CompleteMemorySessionDto {
  @IsInt()
  @Min(1)
  attempts: number;
}