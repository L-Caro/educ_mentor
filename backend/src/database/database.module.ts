/** Configure la connexion à SQLite via TypeORM. `synchronize: true` crée/modifie automatiquement
 * les tables en fonction des entités — pratique en dev, à désactiver en prod sur une vraie BDD.
 * `autoLoadEntities: true` évite de devoir lister manuellement chaque entité ici : TypeORM les
 * découvre via les TypeOrmModule.forFeature([...]) dans chaque module fonctionnel. */
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as path from 'path';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'better-sqlite3',
        database: path.resolve(configService.get<string>('dbPath')!),
        synchronize: true,
        autoLoadEntities: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
