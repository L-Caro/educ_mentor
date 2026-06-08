/** Racine de l'application NestJS. Ce fichier importe tous les modules fonctionnels — c'est l'équivalent
 * d'un registre central. Pour ajouter un module, on l'importe ici. ServeStaticModule gère deux chemins
 * statiques : /media/ pour les images et / pour le build React (SPA fallback). */
import { Module } from '@nestjs/common';
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
import { InvitationModule } from './modules/invitation/invitation.module';

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
    InvitationModule,
  ],
})
export class AppModule {}
