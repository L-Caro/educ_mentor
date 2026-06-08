import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalculSession } from './entities/calcul-session.entity';
import { CalculProgression } from './entities/calcul-progression.entity';
import { CalculService } from './calcul.service';
import { CalculGameController } from './calcul-game.controller';
import { CalculAdminController } from './calcul-admin.controller';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CalculSession, CalculProgression]),
    SettingsModule,
  ],
  controllers: [CalculGameController, CalculAdminController],
  providers: [CalculService],
})
export class CalculModule {}
