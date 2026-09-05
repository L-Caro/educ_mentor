import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompteProgression } from './entities/compte-progression.entity';
import { CompteSession } from './entities/compte-session.entity';
import { CompteService } from './compte.service';
import { CompteGameController } from './compte-game.controller';
import { CompteAdminController } from './compte-admin.controller';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompteProgression, CompteSession]),
    SettingsModule,
    AuthModule,
  ],
  controllers: [CompteGameController, CompteAdminController],
  providers: [CompteService],
})
export class CompteModule {}
