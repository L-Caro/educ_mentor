import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeometrieSession } from './entities/geometrie-session.entity';
import { GeometrieProgression } from './entities/geometrie-progression.entity';
import { GeometrieService } from './geometrie.service';
import { GeometrieGameController } from './geometrie-game.controller';
import { GeometrieAdminController } from './geometrie-admin.controller';
import { AuthModule } from '../auth/auth.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GeometrieSession, GeometrieProgression]),
    AuthModule,
    SettingsModule,
  ],
  providers: [GeometrieService],
  controllers: [GeometrieGameController, GeometrieAdminController],
})
export class GeometrieModule {}
