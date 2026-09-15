import { Module } from '@nestjs/common';
import { ImpressionService } from './impression.service';
import { ImpressionController } from './impression.controller';
import { TablesModule } from '../tables/tables.module';
import { CalculModule } from '../calcul/calcul.module';
import { AuthModule } from '../auth/auth.module';

/** Aucune entite, aucune migration : ce module ne possede rien. Il emprunte les
 * generateurs des autres et n'en garde rien (voir `ImpressionService`). */
@Module({
  imports: [TablesModule, CalculModule, AuthModule],
  controllers: [ImpressionController],
  providers: [ImpressionService],
})
export class ImpressionModule {}
