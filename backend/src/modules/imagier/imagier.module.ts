import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { ImagierWord } from './entities/imagier-word.entity';
import { ImagierProgression } from './entities/imagier-progression.entity';
import { ImagierSession } from './entities/imagier-session.entity';
import { ImagierService } from './imagier.service';
import { ImagierImportService } from './imagier-import.service';
import { ImagierGameController } from './imagier-game.controller';
import { ImagierAdminController } from './imagier-admin.controller';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ImagierWord, ImagierProgression, ImagierSession]),
    MulterModule.register(),
    SettingsModule,
    AuthModule,
  ],
  providers: [ImagierService, ImagierImportService],
  controllers: [ImagierGameController, ImagierAdminController],
})
export class ImagierModule {}
