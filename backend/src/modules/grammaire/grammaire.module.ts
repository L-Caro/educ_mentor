import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GrammaireSession } from './entities/grammaire-session.entity';
import { GrammaireProgression } from './entities/grammaire-progression.entity';
import { GrammaireService } from './grammaire.service';
import { GrammaireGameController } from './grammaire-game.controller';
import { GrammaireAdminController } from './grammaire-admin.controller';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GrammaireSession, GrammaireProgression]),
    AuthModule,
    SettingsModule,
  ],
  providers: [GrammaireService],
  // Exporté pour le péage des jeux, qui emprunte les questions de ce module sans rien
  // enregistrer — voir `PeageService`.
  exports: [GrammaireService],
  controllers: [GrammaireGameController, GrammaireAdminController],
})
export class GrammaireModule {}
