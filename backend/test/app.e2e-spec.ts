import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Test, type TestingModule } from '@nestjs/testing';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import type { Server } from 'node:http';
import { AppModule } from './../src/app.module';

interface CatalogModule {
  id: string;
  name: string;
}

interface Setting {
  key: string;
  value: string;
}

/**
 * Test de démarrage de bout en bout, sur une base VIERGE et jetable.
 *
 * Ce qu'il couvre, et que rien d'autre ne couvre :
 *   - l'application démarre réellement (câblage des modules, injection de dépendances)
 *   - la migration de référence s'applique sur une base neuve et crée le schéma
 *   - les seeds passent (réglages, catalogue de modules)
 *   - l'API répond
 *
 * Autrement dit : le déploiement d'une instance neuve fonctionne. C'est précisément ce qui
 * ne se voyait qu'en production auparavant.
 */

describe("Démarrage de l'application (e2e)", () => {
  let app: INestApplication;
  let dataDir: string;

  beforeAll(async () => {
    dataDir = mkdtempSync(join(tmpdir(), 'educmentor-e2e-'));

    process.env.DB_PATH = join(dataDir, 'test.db');
    process.env.DB_SYNCHRONIZE = 'false'; // le schéma doit venir de la migration, pas d'un realignement
    process.env.ADMIN_PIN_ENABLED = 'false';
    process.env.IMAGES_PATH = dataDir;
    process.env.STATIC_PATH = dataDir;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  }, 60_000);

  const server = () => app.getHttpServer() as Server;

  afterAll(async () => {
    await app?.close();
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('sert le catalogue des modules sur une base neuve', async () => {
    const response = await request(server())
      .get('/api/catalog/modules')
      .expect(200);
    const modules = response.body as CatalogModule[];

    // Les seeds doivent avoir peuplé le catalogue : une liste vide signifierait que la
    // migration a créé les tables mais que le seed n'est jamais passé.
    expect(Array.isArray(modules)).toBe(true);
    expect(modules.length).toBeGreaterThan(0);
    expect(typeof modules[0].id).toBe('string');
    expect(typeof modules[0].name).toBe('string');
  });

  it("n'expose pas le hash du code PIN dans les réglages publics", async () => {
    const response = await request(server()).get('/api/settings').expect(200);
    const keys = (response.body as Setting[]).map((setting) => setting.key);

    expect(keys).not.toContain('admin_pin_hash');
    expect(keys.length).toBeGreaterThan(0); // les réglages publics restent servis
  });

  it('rejette une session de jeu au corps invalide', async () => {
    // Vérifie que le ValidationPipe global est bien actif de bout en bout.
    await request(server())
      .post('/api/conjugaison/session')
      .send({ difficulty: 'impossible' })
      .expect(400);
  });

  it('renvoie 404 sur une route d’API inconnue', async () => {
    await request(server()).get('/api/nexistepas').expect(404);
  });
});
