import { Module } from '@nestjs/common';
import { ImpressionService } from './impression.service';
import { ImpressionController } from './impression.controller';
import { TablesModule } from '../tables/tables.module';
import { CalculModule } from '../calcul/calcul.module';
import { PoseModule } from '../pose/pose.module';
import { DicteeModule } from '../dictee/dictee.module';
import { ConjugaisonModule } from '../conjugaison/conjugaison.module';
import { AccordsModule } from '../accords/accords.module';
import { GrammaireModule } from '../grammaire/grammaire.module';
import { NumerationModule } from '../numeration/numeration.module';
import { HeureModule } from '../heure/heure.module';
import { MonnaieModule } from '../monnaie/monnaie.module';
import { AuthModule } from '../auth/auth.module';

/** Aucune entite, aucune migration : ce module ne possede rien. Il emprunte les
 * generateurs des autres et n'en garde rien (voir `ImpressionService`). */
@Module({
  imports: [
    TablesModule,
    CalculModule,
    PoseModule,
    DicteeModule,
    ConjugaisonModule,
    AccordsModule,
    GrammaireModule,
    NumerationModule,
    HeureModule,
    MonnaieModule,
    AuthModule,
  ],
  controllers: [ImpressionController],
  providers: [ImpressionService],
})
export class ImpressionModule {}
