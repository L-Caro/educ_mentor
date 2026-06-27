import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeoSession } from './entities/geo-session.entity';
import { GeoProgression } from './entities/geo-progression.entity';
import { GeoService } from './geo.service';
import { GeoGameController } from './geo-game.controller';
import { GeoAdminController } from './geo-admin.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GeoSession, GeoProgression]),
    SettingsModule,
  ],
  controllers: [GeoGameController, GeoAdminController],
  providers: [GeoService],
})
export class GeoModule {}