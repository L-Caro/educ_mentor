import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TablesProgression } from './entities/tables-progression.entity';
import { TablesSession } from './entities/tables-session.entity';
import { TablesService } from './tables.service';
import { TablesGameController } from './tables-game.controller';
import { TablesAdminController } from './tables-admin.controller';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TablesProgression, TablesSession]),
    SettingsModule,
    AuthModule,
  ],
  providers: [TablesService],
  // Exporté pour le péage des jeux, qui emprunte les questions de ce module sans rien
  // enregistrer — voir `PeageService`.
  exports: [TablesService],
  controllers: [TablesGameController, TablesAdminController],
})
export class TablesModule {}
