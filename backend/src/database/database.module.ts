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
import * as fs from 'fs';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const synchronize =
          configService.get<boolean>('dbSynchronize') ?? false;
        const configured = configService.get<string>('dbPath')!;
        const database = path.resolve(configured);
        const logger = new Logger('DatabaseModule');

        // `DB_PATH` est relatif dans les .env du projet : il se résout sur le répertoire de
        // travail. Lancé depuis backend/ plutôt que depuis la racine, `./data/educmentor.db`
        // désigne `backend/data/` — et l'application crée une base VIERGE sans rien signaler.
        // Symptôme : toute la progression semble avoir disparu. Cause : invisible.
        // D'où le chemin absolu journalisé à chaque démarrage, et l'avertissement ci-dessous.
        logger.log(`Base de données : ${database}`);
        if (!fs.existsSync(database)) {
          logger.warn(
            'Aucune base à cet emplacement : une base VIERGE va être créée. Si des données ' +
              `étaient attendues, vérifier DB_PATH ("${configured}", résolu depuis ${process.cwd()}).`,
          );
        }

        if (synchronize) {
          logger.warn(
            'DB_SYNCHRONIZE=true : le schéma sera aligné sur les entités au démarrage. ' +
              'À ne jamais activer sur une base contenant des données à conserver.',
          );
        }

        return {
          type: 'better-sqlite3',
          database,
          autoLoadEntities: true,
          synchronize,
          // Extension explicite : un glob `*.{ts,js}` matcherait aussi les `.d.ts` produits par
          // `declaration: true`, que TypeORM tenterait de charger comme des migrations.
          migrations: [
            path.join(
              __dirname,
              `migrations/*.${__filename.endsWith('.js') ? 'js' : 'ts'}`,
            ),
          ],
          migrationsRun: true,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
