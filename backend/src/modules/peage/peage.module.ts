import { Module } from '@nestjs/common';
import { PeageService } from './peage.service';
import { PeageController } from './peage.controller';
import { SettingsModule } from '../settings/settings.module';
import { CatalogModule } from '../catalog/catalog.module';
import { TablesModule } from '../tables/tables.module';
import { CalculModule } from '../calcul/calcul.module';
import { ConjugaisonModule } from '../conjugaison/conjugaison.module';
import { GrammaireModule } from '../grammaire/grammaire.module';
import { AccordsModule } from '../accords/accords.module';

/** Le péage n'a NI entité NI migration : il ne possède aucune donnée. Il emprunte les
 * questions des cinq modules et n'en garde rien — voir `PeageService`. */
@Module({
  imports: [
    SettingsModule,
    CatalogModule,
    TablesModule,
    CalculModule,
    ConjugaisonModule,
    GrammaireModule,
    AccordsModule,
  ],
  controllers: [PeageController],
  providers: [PeageService],
})
export class PeageModule {}
