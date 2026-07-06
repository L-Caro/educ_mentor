import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PenduWord } from './entities/pendu-word.entity';
import { PenduSession } from './entities/pendu-session.entity';
import { PenduService } from './pendu.service';
import { PenduGameController } from './pendu-game.controller';
import { PenduAdminController } from './pendu-admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([PenduWord, PenduSession]), AuthModule],
  providers: [PenduService],
  controllers: [PenduGameController, PenduAdminController],
})
export class PenduModule {}