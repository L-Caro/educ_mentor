import type { ModuleManifest } from 'src/modules.types';
import { imagierModule } from 'src/components/modules/imagier/imagier.module';
import { tablesModule } from 'src/components/modules/tables/tables.module';
import { calculModule } from 'src/components/modules/calcul/calcul.module';
import { monnaieModule } from 'src/components/modules/monnaie/monnaie.module';

// Re-export pour compat des imports existants (`from 'src/modules.manifest'`).
export type { ModuleManifest, ProgressionStat } from 'src/modules.types';

/**
 * Agrégateur : la source unique des modules. Ajouter un module = créer son dossier avec
 * `<id>.module.tsx` (descripteur co-localisé) + une ligne d'import ici.
 */
export const MODULES: ModuleManifest[] = [imagierModule, tablesModule, calculModule, monnaieModule];
