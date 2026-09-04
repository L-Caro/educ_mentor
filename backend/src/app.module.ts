/** Racine de l'application NestJS. Ce fichier importe tous les modules fonctionnels — c'est l'équivalent
 * d'un registre central. Pour ajouter un module, on l'importe ici. ServeStaticModule gère deux chemins
 * statiques : /media/ pour les images et / pour le build React (SPA fallback). */
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import configuration from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogModule } from './modules/catalog/catalog.module';
import { ImagierModule } from './modules/imagier/imagier.module';
import { TablesModule } from './modules/tables/tables.module';
import { CalculModule } from './modules/calcul/calcul.module';
import { MonnaieModule } from './modules/monnaie/monnaie.module';
import { HeureModule } from './modules/heure/heure.module';
import { ConjugaisonModule } from './modules/conjugaison/conjugaison.module';
import { GeoModule } from './modules/geo/geo.module';
import { FranceModule } from './modules/france/france.module';
import { LectureModule } from './modules/lecture/lecture.module';
import { NumerationModule } from './modules/numeration/numeration.module';
import { MemoryModule } from './modules/memory/memory.module';
import { PenduModule } from './modules/pendu/pendu.module';
import { PoseModule } from './modules/pose/pose.module';
import { DicteeModule } from './modules/dictee/dictee.module';
import { GrammaireModule } from './modules/grammaire/grammaire.module';
import { GeometrieModule } from './modules/geometrie/geometrie.module';
import { InvitationModule } from './modules/invitation/invitation.module';
import { AccessGuard } from './modules/invitation/access.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    DatabaseModule,
    ServeStaticModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        // Sert les images depuis data/images/ à /media/
        {
          rootPath: path.resolve(configService.get<string>('imagesPath')!),
          serveRoot: '/media',
          serveStaticOptions: { index: false },
        },
        // Sert le build React (SPA fallback)
        {
          rootPath: path.resolve(configService.get<string>('staticPath')!),
          exclude: ['/api/{*splat}', '/media/{*splat}'],
          serveStaticOptions: { fallthrough: true },
        },
      ],
    }),
    SettingsModule,
    AuthModule,
    CatalogModule,
    ImagierModule,
    TablesModule,
    CalculModule,
    MonnaieModule,
    HeureModule,
    ConjugaisonModule,
    GeoModule,
    FranceModule,
    LectureModule,
    NumerationModule,
    MemoryModule,
    PenduModule,
    PoseModule,
    DicteeModule,
    GeometrieModule,
    GrammaireModule,
    InvitationModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: AccessGuard }],
})
export class AppModule {}
