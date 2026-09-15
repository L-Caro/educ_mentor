import { IsIn, IsInt, Max, Min } from 'class-validator';

/** Les parcours possibles. Le mode d'orientation n'est pas un reglage de confort : il
 * change ce que l'enfant doit se representer, donc ce qu'elle a appris. */
export const PARCOURS = ['enfant', 'robot'] as const;
export type Parcours = (typeof PARCOURS)[number];

export class ReussiteDto {
  @IsIn(PARCOURS)
  parcours: Parcours;

  /** Le rang de l'etape terminee. Borne : une valeur folle ferait sauter tout le
   * parcours d'un coup, et le module n'aurait plus rien a proposer. */
  @IsInt()
  @Min(1)
  @Max(99)
  etape: number;
}
