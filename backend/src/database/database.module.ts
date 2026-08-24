/** Configure la connexion à SQLite via TypeORM.
 *
 * `synchronize` est **désactivé par défaut** : il alignait le schéma sur les entités à chaque
 * démarrage, ce qui peut supprimer une colonne — et ses données — sur une simple modification
 * d'entité. Le schéma n'évolue plus que par migration versionnée (`src/database/migrations/`),
 * appliquée automatiquement au boot via `migrationsRun`.
 *
 * Pour retrouver l'ancien confort en développement local : `DB_SYNCHRONIZE=true` dans le `.env`.
 * Le défaut reste sûr — un oubli de variable ne peut pas détruire de données.
 *
 * `autoLoadEntities: true` évite de lister chaque entité ici : TypeORM les découvre via les
 * `TypeOrmModule.forFeature([...])` de chaque module fonctionnel.
 */
import { Logger, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const synchronize = configService.get<boolean>('dbSynchronize') ?? false;
        const database = path.resolve(configService.get<string>('dbPath')!);

        if (synchronize) {
          new Logger('DatabaseModule').warn(
            'DB_SYNCHRONIZE=true : le schéma sera aligné sur les entités au démarrage. ' +
              'À ne jamais activer sur une base contenant des données à conserver.',
          );
        }

        return {
          type: 'better-sqlite3',
          database,
          autoLoadEntities: true,
          synchronize,
          // Les migrations sont compilées à côté des sources : .ts sous ts-node, .js après build.
          migrations: [path.join(__dirname, `migrations/*.{ts,js}`)],
          migrationsRun: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
