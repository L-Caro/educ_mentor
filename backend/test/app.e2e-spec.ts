import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { Test, type TestingModule } from '@nestjs/testing';
import { ValidationPipe, type INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import type { Server } from 'node:http';
import { AppModule } from './../src/app.module';
import { ConjugaisonService } from './../src/modules/conjugaison/conjugaison.service';
import { AccordsService } from './../src/modules/accords/accords.service';
import { GrammaireService } from './../src/modules/grammaire/grammaire.service';
import { NumerationService } from './../src/modules/numeration/numeration.service';
import { CalculService } from './../src/modules/calcul/calcul.service';
import { PoseService } from './../src/modules/pose/pose.service';
import { CompteService } from './../src/modules/compte/compte.service';
import { CatalogService } from './../src/modules/catalog/catalog.service';
import { MODULES_DE_PEAGE } from './../src/modules/peage/peage.types';
import { rejouer, type Etape } from './../src/modules/compte/compte.generator';
import { NOMS } from './../src/modules/accords/accords.corpus';
import { familleDuNom } from './../src/modules/accords/accords.familles';

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

  /** Les pluriels réellement classés en `pluriel_aux` — chevaux, animaux, journaux,
   * hôpitaux. Lus du corpus plutôt que devinés d'une terminaison. */
  const PLURIELS_EN_AUX = NOMS.filter(
    (nom) => familleDuNom(nom) === 'pluriel_aux',
  ).map((nom) => nom.pluriel);

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

    // Remettre le socle : ce réglage est global, le laisser modifié ferait échouer les
    // tests suivants pour une raison qui n'a rien à voir avec ce qu'ils vérifient.
    await request(server())
      .patch('/api/accords/notions-actives')
      .send({ keys: ['genre_nom', 'nombre_nom', 'accord_adjectif'] })
      .expect(200);
  });

  // ─── Conjugaison : les temps des grandes classes ────────────────────────────

  it('n’ouvre que les trois temps simples à l’installation', async () => {
    const temps = (
      await request(server()).get('/api/conjugaison/temps').expect(200)
    ).body as { key: string; niveau: string }[];
    expect(temps.map((t) => t.key)).toEqual(['présent', 'imparfait', 'futur']);
  });

  it('refuse de jouer un temps fermé, même demandé explicitement', async () => {
    // Le passé composé EXISTE dans le catalogue, mais il n'est pas ouvert : le service
    // ne doit pas le servir sous prétexte qu'il a été demandé.
    const session = (
      await request(server())
        .post('/api/conjugaison/session')
        .send({ tenses: ['passé composé'], verb_groups: ['1'] })
        .expect(201)
    ).body as { questions: { tense: string }[] };
    for (const question of session.questions) {
      expect(question.tense).not.toBe('passé composé');
    }
  });

  it('sert le passé composé une fois le temps ouvert en administration', async () => {
    await app
      .get(ConjugaisonService)
      .setActiveTenseKeys(['présent', 'passé composé']);

    const temps = (
      await request(server()).get('/api/conjugaison/temps').expect(200)
    ).body as { key: string }[];
    expect(temps.map((t) => t.key)).toContain('passé composé');

    const session = (
      await request(server())
        .post('/api/conjugaison/session')
        .send({ tenses: ['passé composé'], verb_groups: ['1'] })
        .expect(201)
    ).body as { questions: { tense: string; conjugated: string }[] };
    expect(session.questions.length).toBeGreaterThan(0);
    for (const question of session.questions) {
      expect(question.tense).toBe('passé composé');
      // Auxiliaire + participe, et jamais le pronom : l'élision est faite à l'affichage.
      expect(question.conjugated).toContain(' ');
      expect(question.conjugated).not.toMatch(/^(je|j')/);
    }
  });

  // ─── Accords : les familles des grandes classes ─────────────────────────────

  it('ne sert pas un pluriel en -aux tant que la famille est fermée', async () => {
    await app
      .get(AccordsService)
      .setActiveNotionKeys(['genre_nom', 'nombre_nom', 'accord_adjectif']);

    const session = (
      await request(server())
        .post('/api/accords/session')
        .send({ question_types: ['nombre_nom'], difficulty: 'hard' })
        .expect(201)
    ).body as { questions: { answer: string }[] };
    // Comparer à la LISTE réelle, pas à une terminaison : « eaux », pluriel de « eau »,
    // se termine par `aux` sans être un pluriel en -aux. C'est exactement le piège que
    // `familleDuNom` évite en testant aussi le singulier.
    for (const question of session.questions) {
      expect(PLURIELS_EN_AUX).not.toContain(question.answer);
    }
  });

  it('sert le pluriel en -aux une fois la famille ouverte', async () => {
    const service = app.get(AccordsService);
    await service.setActiveNotionKeys([
      'genre_nom',
      'nombre_nom',
      'accord_adjectif',
    ]);
    const socle = await service.getActiveFamilleKeys();
    await service.setActiveFamilleKeys([...socle, 'pluriel_aux']);

    const vus = new Set<string>();
    for (let essai = 0; essai < 6; essai++) {
      const session = (
        await request(server())
          .post('/api/accords/session')
          .send({ question_types: ['nombre_nom'], difficulty: 'hard' })
          .expect(201)
      ).body as { questions: { answer: string }[] };
      for (const question of session.questions) vus.add(question.answer);
    }
    expect([...vus].some((forme) => PLURIELS_EN_AUX.includes(forme))).toBe(
      true,
    );

    await service.setActiveFamilleKeys(socle);
  });

  // ─── Grammaire : les classes de phrases ─────────────────────────────────────

  it('ne sert aucune phrase de grande classe tant qu’elle est fermée', async () => {
    const service = app.get(GrammaireService);
    await service.setActiveNotionKeys(['nom_commun', 'verbe', 'determinant']);

    const grandes = new Set(
      service
        .getClasses()
        .filter((c) => !c.defaultActive)
        .map((c) => c.key),
    );
    expect(grandes.size).toBeGreaterThan(0);
    expect(await service.getActiveClassKeys()).toEqual(['cp', 'ce1']);

    // Les phrases de CE2+ portent un complément d'objet annoté ; aucune ne doit sortir.
    const session = (
      await request(server())
        .post('/api/grammaire/session')
        .send({ question_types: ['nature_mot'], difficulty: 'hard' })
        .expect(201)
    ).body as { questions: { item_key: string }[] };
    for (const question of session.questions) {
      expect(question.item_key).not.toMatch(/_(ce2|cm1|cm2)-/);
    }
  });

  it('sert les phrases de CM1 et interroge l’attribut une fois ouverts', async () => {
    const service = app.get(GrammaireService);
    await service.setActiveClassKeys(['cp', 'ce1', 'ce2', 'cm1', 'cm2']);
    await service.setActiveNotionKeys(['attribut']);

    const session = (
      await request(server())
        .post('/api/grammaire/session')
        .send({ question_types: ['trouver_fonction'], difficulty: 'hard' })
        .expect(201)
    ).body as {
      questions: { skill_key: string; answer_indices: number[] }[];
    };
    expect(session.questions.length).toBeGreaterThan(0);
    for (const question of session.questions) {
      expect(question.skill_key).toBe('attribut');
      expect(question.answer_indices.length).toBeGreaterThan(0);
    }

    await service.setActiveClassKeys(['cp', 'ce1']);
  });

  // ─── Numération : millions et décimaux ──────────────────────────────────────

  it('sert le catalogue des positions, des millièmes aux centaines de millions', async () => {
    const positions = (
      await request(server()).get('/api/numeration/positions').expect(200)
    ).body as { key: string; exposant: number; niveau: string }[];
    expect(positions.map((p) => p.key)).toContain('millieme');
    expect(positions.map((p) => p.key)).toContain('cmi');
    expect(Math.min(...positions.map((p) => p.exposant))).toBe(-3);
    expect(Math.max(...positions.map((p) => p.exposant))).toBe(8);
  });

  it('reste entier tant qu’aucune décimale n’est ouverte', async () => {
    const session = (
      await request(server())
        .post('/api/numeration/session')
        .send({ question_types: ['comparaison'] })
        .expect(201)
    ).body as { questions: { display: string }[] };
    expect(session.questions.length).toBeGreaterThan(0);
    for (const question of session.questions) {
      expect(question.display).not.toContain(',');
    }
  });

  it('fait apparaître la virgule une fois les centièmes ouverts', async () => {
    const service = app.get(NumerationService);
    await service.setActivePositions(['centieme', 'dixieme', 'u', 'd']);

    const session = (
      await request(server())
        .post('/api/numeration/session')
        .send({ question_types: ['comparaison'] })
        .expect(201)
    ).body as { questions: { display: string; answer: string }[] };
    expect(session.questions.length).toBeGreaterThan(0);
    for (const question of session.questions) {
      // Deux décimales exactement, virgule française, jamais de point.
      expect(question.display).toMatch(/^\d+,\d{2} {2}□ {2}\d+,\d{2}$/);
      expect(['<', '>', '=']).toContain(question.answer);
    }

    await service.setActivePositions(['u', 'd']);
  });

  // ─── Calcul mental : le multiplicatif ───────────────────────────────────────

  it('n’ouvre que l’additif à l’installation', async () => {
    const types = (await request(server()).get('/api/calcul/types').expect(200))
      .body as { key: string }[];
    expect(types.map((t) => t.key).sort()).toEqual(
      ['addition', 'complement', 'double', 'moitie', 'soustraction'].sort(),
    );
  });

  it('refuse une multiplication tant que le type est fermé', async () => {
    const session = (
      await request(server())
        .post('/api/calcul/session')
        .send({ operation_types: ['multiplication'] })
        .expect(201)
    ).body as { questions: { operation: string }[] };
    for (const question of session.questions) {
      expect(question.operation).not.toContain('×');
    }
  });

  it('sert des multiplications et des divisions exactes une fois ouvertes', async () => {
    const service = app.get(CalculService);
    await service.setActiveOperationTypes([
      'multiplication',
      'division',
      'multiplier_10',
      'diviser_10',
      'complement_100',
    ]);

    const session = (
      await request(server())
        .post('/api/calcul/session')
        .send({ operation_types: ['multiplication', 'division'] })
        .expect(201)
    ).body as { questions: { operation: string; answer: number }[] };
    expect(session.questions.length).toBeGreaterThan(0);

    for (const question of session.questions) {
      // La réponse doit être un entier : une division inexacte ne se pose pas de tête.
      expect(Number.isInteger(question.answer)).toBe(true);
      expect(question.answer).toBeGreaterThan(0);

      const mult = /^(\d+) × (\d+) = \?$/.exec(question.operation);
      const div = /^(\d+) ÷ (\d+) = \?$/.exec(question.operation);
      expect(Boolean(mult || div)).toBe(true);
      if (mult) {
        expect(Number(mult[1]) * Number(mult[2])).toBe(question.answer);
      }
      if (div) {
        // Exacte par construction : le dividende est bâti depuis le quotient.
        expect(Number(div[1]) % Number(div[2])).toBe(0);
        expect(Number(div[1]) / Number(div[2])).toBe(question.answer);
      }
    }
  });

  it('multiplie et divise par 10, 100, 1000 sans jamais produire de décimal', async () => {
    const session = (
      await request(server())
        .post('/api/calcul/session')
        .send({ operation_types: ['multiplier_10', 'diviser_10'] })
        .expect(201)
    ).body as { questions: { operation: string; answer: number }[] };
    for (const question of session.questions) {
      expect(Number.isInteger(question.answer)).toBe(true);
      expect(question.operation).toMatch(/(×|÷) (10|100|1000) = \?$/);
    }
  });

  it('donne des compléments à 100 et 1000 sur des nombres ronds', async () => {
    const session = (
      await request(server())
        .post('/api/calcul/session')
        .send({ operation_types: ['complement_100'] })
        .expect(201)
    ).body as { questions: { operation: string; answer: number }[] };
    for (const question of session.questions) {
      const m = /^(\d+) pour aller à (100|1000)$/.exec(question.operation)!;
      expect(m).not.toBeNull();
      expect(Number(m[2]) - Number(m[1])).toBe(question.answer);
      expect(question.answer).toBeGreaterThan(0);
    }
  });

  // ─── Calcul posé : la multiplication ────────────────────────────────────────

  it('n’ouvre que l’addition et la soustraction à l’installation', async () => {
    const operations = (
      await request(server()).get('/api/pose/operations').expect(200)
    ).body as { key: string }[];
    expect(operations.map((o) => o.key).sort()).toEqual([
      'addition',
      'soustraction',
    ]);
  });

  it('refuse une multiplication posée tant qu’elle est fermée', async () => {
    const session = (
      await request(server())
        .post('/api/pose/session')
        .send({ operations: ['multiplication'] })
        .expect(201)
    ).body as { questions: { operation: string }[] };
    for (const question of session.questions) {
      expect(question.operation).not.toBe('multiplication');
    }
  });

  it('sert des multiplications posées justes une fois ouvertes', async () => {
    const service = app.get(PoseService);
    await service.setActiveOperations(['multiplication']);

    const session = (
      await request(server())
        .post('/api/pose/session')
        .send({ operations: ['multiplication'] })
        .expect(201)
    ).body as {
      questions: {
        operation: string;
        operands: number[];
        answer: number;
        columns: number;
        partiels: { valeur: number; decalage: number }[];
        retenues: { haut: (number | null)[]; bas: (number | null)[] };
      }[];
    };
    expect(session.questions.length).toBeGreaterThan(0);

    for (const question of session.questions) {
      expect(question.operation).toBe('multiplication');
      expect(question.answer).toBe(question.operands[0] * question.operands[1]);

      // Les produits partiels, remis à leur décalage, doivent redonner le résultat.
      const somme = question.partiels.reduce(
        (total, p) => total + p.valeur * 10 ** p.decalage,
        0,
      );
      expect(somme).toBe(question.answer);

      // La grille doit être assez large pour le résultat ET pour le produit le plus décalé.
      const largeurMax = Math.max(
        String(question.answer).length,
        ...question.partiels.map((p) => String(p.valeur).length + p.decalage),
      );
      expect(question.columns).toBeGreaterThanOrEqual(largeurMax);

      // Aucune rangée de retenue en multiplication.
      expect(question.retenues.haut.every((v) => v === null)).toBe(true);
      expect(question.retenues.bas.every((v) => v === null)).toBe(true);
    }

    await service.setActiveOperations(['addition', 'soustraction']);
  });

  // ─── Le compte est bon ──────────────────────────────────────────────────────

  it('sert des tirages TOUJOURS solubles, vérifiés en rejouant', async () => {
    // Le tirage traverse ici toute la pile — service, contrôleur, sérialisation JSON.
    // Et il est jugé comme l'enfant le jugera : en rejouant la solution sur les plaques
    // reçues. Recalculer avec le code qui l'a produite ne vérifierait rien.
    const session = (
      await request(server())
        .post('/api/compte/session')
        .send({ difficulty: 'hard' })
        .expect(201)
    ).body as {
      questions: { cible: number; plaques: number[]; solution: Etape[] }[];
    };
    expect(session.questions.length).toBeGreaterThan(0);

    for (const question of session.questions) {
      expect(question.plaques).toHaveLength(6);
      const controle = rejouer(question.plaques, question.solution);
      expect(controle).not.toBeNull();
      expect(controle!.resultat).toBe(question.cible);
    }
  });

  it('n’ouvre que l’addition et la soustraction à l’installation', async () => {
    const operations = (
      await request(server()).get('/api/compte/operations').expect(200)
    ).body as { key: string }[];
    expect(operations.map((o) => o.key)).toEqual(['+', '-']);
  });

  it('refuse la division tant qu’elle est fermée', async () => {
    const session = (
      await request(server())
        .post('/api/compte/session')
        .send({ operations: ['÷'] })
        .expect(201)
    ).body as { questions: { solution: Etape[] }[] };
    expect(session.questions.length).toBeGreaterThan(0);
    for (const question of session.questions) {
      for (const etape of question.solution) {
        expect(etape.operation).not.toBe('÷');
      }
    }
  });

  it('sert des divisions EXACTES une fois la division ouverte', async () => {
    const service = app.get(CompteService);
    await service.setActiveOperations(['÷']);

    const session = (
      await request(server())
        .post('/api/compte/session')
        .send({ difficulty: 'medium', operations: ['÷'] })
        .expect(201)
    ).body as {
      questions: { cible: number; plaques: number[]; solution: Etape[] }[];
    };
    expect(session.questions.length).toBeGreaterThan(0);

    for (const question of session.questions) {
      for (const etape of question.solution) {
        expect(etape.operation).toBe('÷');
        // Une division inexacte n'a pas de plaque : le reste doit être nul.
        expect(etape.a % etape.b).toBe(0);
        expect(etape.a / etape.b).toBe(etape.resultat);
      }
      expect(rejouer(question.plaques, question.solution)!.resultat).toBe(
        question.cible,
      );
    }

    await service.setActiveOperations(['+', '-']);
  });

  // ─── Le péage des jeux ──────────────────────────────────────────────────────

  it('ne pose aucune question tant qu’aucun module n’est activé', async () => {
    // Les modules arrivent dormants. Le péage ne doit pas les réveiller par la bande :
    // poser une question de conjugaison alors que le module est éteint contournerait le
    // seul réglage qui décide de ce que l'enfant voit.
    const etat = (await request(server()).get('/api/peage').expect(200))
      .body as { questions: number; modules: string[] };
    expect(etat.questions).toBe(0);
    expect(etat.modules).toEqual([]);

    const { question } = (
      await request(server()).get('/api/peage/question').expect(200)
    ).body as { question: unknown };
    expect(question).toBeNull();
  });

  it('pose une question COMPLÈTE une fois les modules activés', async () => {
    // Le test qui compte : il traverse les vrais adaptateurs des cinq modules, pas des
    // doublures. Une question mal formée — sans bonne réponse dans ses propositions, ou
    // sans propositions du tout — bloquerait l'enfant à la porte d'un jeu.
    const catalog = app.get(CatalogService);
    for (const { id } of MODULES_DE_PEAGE) {
      await catalog.update(id, { is_active: true });
    }

    const vus = new Set<string>();
    for (let essai = 0; essai < 40; essai++) {
      const { question } = (
        await request(server()).get('/api/peage/question').expect(200)
      ).body as {
        question: {
          module_id: string;
          module_nom: string;
          consigne: string;
          enonce: string;
          choix: string[];
          reponse: string;
        } | null;
      };
      expect(question).not.toBeNull();
      vus.add(question!.module_id);

      expect(question!.consigne.length).toBeGreaterThan(0);
      expect(question!.enonce.length).toBeGreaterThan(0);
      // Un péage se franchit d'une touche : il faut de quoi toucher, et la bonne réponse
      // doit être parmi les propositions.
      expect(question!.choix.length).toBeGreaterThanOrEqual(2);
      expect(question!.choix).toContain(question!.reponse);
      expect(new Set(question!.choix).size).toBe(question!.choix.length);
    }

    // Sur quarante tirages, le hasard doit avoir visité plusieurs modules — sinon c'est
    // qu'un seul répond, et les quatre autres sont muets sans qu'on le sache.
    expect(vus.size).toBeGreaterThan(1);

    for (const { id } of MODULES_DE_PEAGE) {
      await catalog.update(id, { is_active: false });
    }
  });
});
