/** Point d'entrée du serveur. NestFactory crée l'app à partir de AppModule (qui liste tous les modules),
 * puis on configure deux choses globales : le préfixe /api sur toutes les routes, et la validation
 * automatique des corps de requête (ValidationPipe rejette les champs inconnus et transforme les types). */
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3000;

  await app.listen(port);
  console.log(`ÉducMentor démarré sur http://localhost:${port}`);
}
bootstrap();
