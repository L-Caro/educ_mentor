import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccordsSession } from './entities/accords-session.entity';
import { AccordsProgression } from './entities/accords-progression.entity';
import { AccordsService } from './accords.service';
import { AccordsGameController } from './accords-game.controller';
import { AccordsAdminController } from './accords-admin.controller';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AccordsSession, AccordsProgression]),
    AuthModule,
    SettingsModule,
  ],
  providers: [AccordsService],
  // Exporté pour le péage des jeux, qui emprunte les questions de ce module sans rien
  // enregistrer — voir `PeageService`.
  exports: [AccordsService],
  controllers: [AccordsGameController, AccordsAdminController],
})
export class AccordsModule {}
