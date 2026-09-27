import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AlphabetMotExclu } from './entities/alphabet-mot-exclu.entity';
import { AlphabetService } from './alphabet.service';
import { AlphabetGameController } from './alphabet-game.controller';
import { AlphabetAdminController } from './alphabet-admin.controller';
import { SettingsModule } from '../settings/settings.module';
import { AuthModule } from '../auth/auth.module';

/** Le corpus est un FICHIER, pas une table : produit par script depuis Lexique, il ne se
 * modifie pas a la main. Seules les exclusions vivent en base, parce qu'elles se
 * decouvrent en jouant. */
@Module({
  imports: [
    TypeOrmModule.forFeature([AlphabetMotExclu]),
    SettingsModule,
    AuthModule,
  ],
  controllers: [AlphabetGameController, AlphabetAdminController],
  providers: [AlphabetService],
  exports: [AlphabetService],
})
export class AlphabetModule {}
