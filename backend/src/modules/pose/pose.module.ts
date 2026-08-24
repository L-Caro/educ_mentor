import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PoseProgression } from './entities/pose-progression.entity';
import { PoseSession } from './entities/pose-session.entity';
import { PoseService } from './pose.service';
import { PoseGameController } from './pose-game.controller';
import { PoseAdminController } from './pose-admin.controller';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PoseProgression, PoseSession]),
    SettingsModule,
    AuthModule,
  ],
  controllers: [PoseGameController, PoseAdminController],
  providers: [PoseService],
})
export class PoseModule {}
