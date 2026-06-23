import type { ModuleManifest } from 'src/types/modules.types.ts';
import { imagierModule } from 'src/modules/imagier/imagier.module';
import { tablesModule } from 'src/modules/tables/tables.module';
import { calculModule } from 'src/modules/calcul/calcul.module';
import { monnaieModule } from 'src/modules/monnaie/monnaie.module';
import { snakeModule } from 'src/modules/snake/snake.module';
import { heureModule } from 'src/modules/heure/heure.module';

// Re-export pour compat des imports existants (`from 'src/modules.manifest'`).
export type { ModuleManifest, ProgressionStat } from 'src/types/modules.types.ts';

/**
 * Agrégateur : la source unique des modules. Ajouter un module = créer son dossier avec
 * `<id>.module.tsx` (descripteur co-localisé) + une ligne d'import ici.
 */
export const MODULES: ModuleManifest[] = [imagierModule, tablesModule, calculModule, monnaieModule, snakeModule, heureModule];
