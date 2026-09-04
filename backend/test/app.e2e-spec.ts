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

  // ── Module dictée : import → pré-jeu → partie → correction ────────────────
  // Couvre les deux migrations du module et tout le chemin de requête sur une base neuve.
  it('joue une dictée de bout en bout', async () => {
    const importResponse = await request(server())
      .post('/api/dictee/import')
      .send({
        json: JSON.stringify({
          items: [
            {
              niveau: 'normal',
              contenu: 'Le chat gris dort.',
              notions: ['accents : é è ê'],
            },
            {
              niveau: 'normal',
              contenu: 'La souris mange le fromage.',
              notions: ['accord sujet-verbe'],
            },
          ],
        }),
        activate: true,
      })
      .expect(201);
    expect(importResponse.body).toMatchObject({ inserted: 2, replaced: false });

    const notions = (
      await request(server()).get('/api/dictee/notions').expect(200)
    ).body as string[];
    expect(notions).toContain('accents : é è ê');

    const session = (
      await request(server())
        .post('/api/dictee/session')
        .send({ niveau: 'normal', longueur: 'moyenne' })
        .expect(201)
    ).body as { session_id: string; items: unknown[]; total_words: number };
    expect(session.items).toHaveLength(2);
    expect(session.total_words).toBeGreaterThan(0);

    await request(server())
      .post(`/api/dictee/session/${session.session_id}/complete`)
      .send({ wrongWords: ['chat', 'fromage'] })
      .expect(201);

    const progression = (
      await request(server()).get('/api/dictee/progression').expect(200)
    ).body as { incorrect_count: number }[];
    expect(progression.reduce((sum, row) => sum + row.incorrect_count, 0)).toBe(
      2,
    );

    const errors = (
      await request(server()).get('/api/dictee/mots-difficiles').expect(200)
    ).body as { word: string }[];
    expect(errors.map((entry) => entry.word).sort()).toEqual([
      'chat',
      'fromage',
    ]);
  });

  it('refuse une session de dictée sur un niveau sans contenu', async () => {
    await request(server())
      .post('/api/dictee/session')
      .send({ niveau: 'difficile', longueur: 'courte' })
      .expect(400);
  });

  // ── Module géométrie : figures actives → partie → correction → progression ─
  it('joue une partie de géométrie avec le socle CE1 par défaut', async () => {
    const session = (
      await request(server())
        .post('/api/geometrie/session')
        .send({})
        .expect(201)
    ).body as { session_id: string; questions: { skill_key: string }[] };
    expect(session.questions.length).toBeGreaterThan(0);

    const [question] = session.questions;
    await request(server())
      .post(`/api/geometrie/session/${session.session_id}/answer`)
      .send({ skill_key: question.skill_key, is_correct: true })
      .expect(201);

    await request(server())
      .post(`/api/geometrie/session/${session.session_id}/complete`)
      .send({ correct_answers: 1, total_questions: session.questions.length })
      .expect(201);

    const progression = (
      await request(server()).get('/api/geometrie/progression').expect(200)
    ).body as { skill_key: string; correct_count: number }[];
    expect(
      progression.find((row) => row.skill_key === question.skill_key)
        ?.correct_count,
    ).toBe(1);
  });

  it('les figures actives se règlent depuis l’admin et se répercutent sur les questions', async () => {
    await request(server())
      .patch('/api/geometrie/figures-actives')
      .send({ keys: ['carre'] })
      .expect(200);

    // Une seule figure plane active : « propriétés » n'a personne à comparer.
    await request(server())
      .post('/api/geometrie/session')
      .send({ question_types: ['proprietes'] })
      .expect(400);

    const nomFigure = (
      await request(server())
        .post('/api/geometrie/session')
        .send({ question_types: ['nom_figure'] })
        .expect(201)
    ).body as { questions: { shape: string }[] };
    expect(nomFigure.questions.every((q) => q.shape === 'carre')).toBe(true);

    // On remet le socle par défaut pour ne pas influencer d'autres tests du fichier.
    await request(server())
      .patch('/api/geometrie/figures-actives')
      .send({
        keys: [
          'triangle',
          'triangleRectangle',
          'carre',
          'rectangle',
          'cercle',
          'cube',
          'pave',
          'pyramide',
          'cone',
        ],
      })
      .expect(200);
  });

  // ─── Grammaire ──────────────────────────────────────────────────────────────

  it('joue une partie de grammaire et suit la progression par notion', async () => {
    const session = (
      await request(server())
        .post('/api/grammaire/session')
        .send({})
        .expect(201)
    ).body as {
      session_id: string;
      questions: {
        skill_key: string;
        mots: Record<string, unknown>[];
        answer_indices: number[];
      }[];
    };
    expect(session.questions.length).toBeGreaterThan(0);

    // La nature et la fonction des mots ne voyagent pas : elles SONT la réponse.
    for (const question of session.questions) {
      for (const mot of question.mots) {
        expect(Object.keys(mot).sort()).toEqual(['apres', 'colle', 'mot']);
      }
    }

    const [question] = session.questions;
    await request(server())
      .post(`/api/grammaire/session/${session.session_id}/answer`)
      .send({ skill_key: question.skill_key, is_correct: true })
      .expect(201);

    await request(server())
      .post(`/api/grammaire/session/${session.session_id}/complete`)
      .send({ correct_answers: 1, total_questions: session.questions.length })
      .expect(201);

    const progression = (
      await request(server()).get('/api/grammaire/progression').expect(200)
    ).body as { skill_key: string; correct_count: number }[];
    expect(
      progression.find((row) => row.skill_key === question.skill_key)
        ?.correct_count,
    ).toBe(1);
  });

  it('la porte des notions de grammaire ferme les exercices non activés', async () => {
    // `groupe_nominal` est inactif au démarrage : la fonction des mots vient après leur
    // nature, dans les fiches comme dans le socle par défaut.
    const refus = await request(server())
      .post('/api/grammaire/session')
      .send({ question_types: ['groupe_nominal'] })
      .expect(400);
    expect((refus.body as { message: string }).message).toMatch(
      /groupe nominal/,
    );

    await request(server())
      .patch('/api/grammaire/notions-actives')
      .send({ keys: ['nom_commun', 'verbe', 'groupe_nominal'] })
      .expect(200);

    const session = (
      await request(server())
        .post('/api/grammaire/session')
        .send({ question_types: ['groupe_nominal'] })
        .expect(201)
    ).body as { questions: { skill_key: string }[] };
    expect(session.questions.length).toBeGreaterThan(0);
    for (const question of session.questions) {
      expect(question.skill_key).toBe('groupe_nominal');
    }
  });

  // ─── Accords ────────────────────────────────────────────────────────────────

  it('joue une partie d’accords et suit la progression par notion', async () => {
    const session = (
      await request(server()).post('/api/accords/session').send({}).expect(201)
    ).body as {
      session_id: string;
      questions: { skill_key: string; answer: string }[];
    };
    expect(session.questions.length).toBeGreaterThan(0);

    const [question] = session.questions;
    expect(question.answer.length).toBeGreaterThan(0);

    await request(server())
      .post(`/api/accords/session/${session.session_id}/answer`)
      .send({ skill_key: question.skill_key, is_correct: true })
      .expect(201);

    await request(server())
      .post(`/api/accords/session/${session.session_id}/complete`)
      .send({ correct_answers: 1, total_questions: session.questions.length })
      .expect(201);

    const progression = (
      await request(server()).get('/api/accords/progression').expect(200)
    ).body as { skill_key: string; correct_count: number }[];
    expect(
      progression.find((row) => row.skill_key === question.skill_key)
        ?.correct_count,
    ).toBe(1);
  });

  it('la porte des accords ferme les exercices non activés', async () => {
    // `accord_sujet_verbe` est inactif au démarrage : il vient après le genre et le nombre.
    const refus = await request(server())
      .post('/api/accords/session')
      .send({ question_types: ['accord_sujet_verbe'] })
      .expect(400);
    expect((refus.body as { message: string }).message).toMatch(/sujet-verbe/);

    await request(server())
      .patch('/api/accords/notions-actives')
      .send({ keys: ['genre_nom', 'accord_sujet_verbe'] })
      .expect(200);

    const session = (
      await request(server())
        .post('/api/accords/session')
        .send({ question_types: ['accord_sujet_verbe'] })
        .expect(201)
    ).body as { questions: { skill_key: string; choices: string[] }[] };
    expect(session.questions.length).toBeGreaterThan(0);
    for (const question of session.questions) {
      expect(question.skill_key).toBe('accord_sujet_verbe');
      // Le QCM oppose toujours deux formes du même verbe : c'est toute la notion.
      expect(question.choices.length).toBeGreaterThanOrEqual(2);
    }
  });
});
