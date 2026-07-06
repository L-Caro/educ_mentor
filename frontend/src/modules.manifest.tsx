import type { ModuleManifest } from 'src/types/modules.types.ts';
import { imagierModule } from 'src/modules/imagier/imagier.module';
import { tablesModule } from 'src/modules/tables/tables.module';
import { calculModule } from 'src/modules/calcul/calcul.module';
import { monnaieModule } from 'src/modules/monnaie/monnaie.module';
import { snakeModule } from 'src/modules/snake/snake.module';
import { heureModule } from 'src/modules/heure/heure.module';
import { conjugaisonModule } from 'src/modules/conjugaison/conjugaison.module';
import { geoModule } from 'src/modules/geo/geo.module';
import { franceModule } from 'src/modules/france/france.module';
import { lectureModule } from 'src/modules/lecture/lecture.module';
import { numerationModule } from 'src/modules/numeration/numeration.module';
import { memoryModule } from 'src/modules/memory/memory.module';

// Re-export pour compat des imports existants (`from 'src/modules.manifest'`).
export type { ModuleManifest, ProgressionStat } from 'src/types/modules.types.ts';

/**
 * Agrégateur : la source unique des modules. Ajouter un module = créer son dossier avec
 * `<id>.module.tsx` (descripteur co-localisé) + une ligne d'import ici.
 */
export const MODULES: ModuleManifest[] = [imagierModule, tablesModule, calculModule, monnaieModule, snakeModule, heureModule, conjugaisonModule, geoModule, franceModule, lectureModule, numerationModule, memoryModule];
