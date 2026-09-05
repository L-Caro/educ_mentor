/** Point d'entrée du serveur. NestFactory crée l'app à partir de AppModule (qui liste tous les modules),
 * puis on configure deux choses globales : le préfixe /api sur toutes les routes, et la validation
 * automatique des corps de requête (ValidationPipe rejette les champs inconnus et transforme les types). */
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { collectProductionSecretIssues } from './config/configuration';

async function bootstrap() {
  // Fail-fast AVANT toute création de contexte Nest : mieux vaut ne pas démarrer du tout que
  // démarrer avec un secret public. Le conteneur redémarre en boucle, le problème est visible.
  const secretIssues = collectProductionSecretIssues(process.env);
  if (secretIssues.length > 0) {
    const logger = new Logger('Bootstrap');
    logger.error('Démarrage refusé : configuration de production incomplète :');
    for (const issue of secretIssues) logger.error(`  - ${issue}`);
    process.exit(1);
  }

  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;

  await app.listen(port);
  console.log(`ÉducMentor démarré sur http://localhost:${port}`);
}
bootstrap().catch((error) => {
  // Sans ce catch, un échec de démarrage (port occupé, migration en erreur) laissait le
  // process vivant sans serveur à l'écoute : un conteneur « up » mais inutilisable.
  Logger.error(
    'Échec du démarrage',
    error instanceof Error ? error.stack : String(error),
    'Bootstrap',
  );
  process.exit(1);
});
