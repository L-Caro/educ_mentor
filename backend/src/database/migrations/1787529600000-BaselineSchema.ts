import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration de référence (baseline) — fige le schéma tel qu'il existait le 2026-08-24,
 * date à laquelle le projet est passé de `synchronize: true` à des migrations versionnées.
 *
 * Pourquoi `IF NOT EXISTS` : cette migration doit être jouable sur DEUX états de départ.
 *   - base vierge (nouveau déploiement, CI, test) → elle crée les 29 tables
 *   - base existante (prod, dev) → elle ne fait rien, et enregistre simplement le point de départ
 * Sans cela, le premier boot en mode migration planterait sur un `table already exists`.
 *
 * Le schéma a été dérivé des entités puis vérifié identique à la base de dev existante
 * (voir `npm run db:check`, à lancer sur la prod avant le premier déploiement).
 */
export class BaselineSchema1787529600000 implements MigrationInterface {
  name = 'BaselineSchema1787529600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const statements = [
      `CREATE TABLE IF NOT EXISTS "calcul_progression" ("id" varchar PRIMARY KEY NOT NULL, "answer_value" integer NOT NULL, "correct_count" integer NOT NULL DEFAULT (0), "incorrect_count" integer NOT NULL DEFAULT (0), "is_mastered" boolean NOT NULL DEFAULT (0), "last_seen" datetime, CONSTRAINT "UQ_ccc84729e36cbe86c1edd83d91a" UNIQUE ("answer_value"))`,
      `CREATE TABLE IF NOT EXISTS "calcul_sessions" ("id" varchar PRIMARY KEY NOT NULL, "min_value" integer NOT NULL DEFAULT (0), "max_value" integer NOT NULL DEFAULT (20), "timer_seconds" integer NOT NULL DEFAULT (0), "correct_answers" integer, "total_questions" integer, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
      `CREATE TABLE IF NOT EXISTS "conjugaison_progression" ("id" varchar PRIMARY KEY NOT NULL, "verb_tense" varchar NOT NULL, "correct_count" integer NOT NULL DEFAULT (0), "incorrect_count" integer NOT NULL DEFAULT (0), "is_mastered" boolean NOT NULL DEFAULT (0), "last_seen" datetime, CONSTRAINT "UQ_4db16d9b775d98260fe0e80eebd" UNIQUE ("verb_tense"))`,
      `CREATE TABLE IF NOT EXISTS "conjugaison_sessions" ("id" varchar PRIMARY KEY NOT NULL, "difficulty" varchar NOT NULL, "tenses" varchar, "verb_groups" varchar, "direction" varchar NOT NULL DEFAULT ('forward'), "timer_seconds" integer NOT NULL DEFAULT (0), "correct_answers" integer, "total_questions" integer, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
      `CREATE TABLE IF NOT EXISTS "france_progression" ("id" varchar PRIMARY KEY NOT NULL, "item_key" varchar NOT NULL, "correct_count" integer NOT NULL DEFAULT (0), "incorrect_count" integer NOT NULL DEFAULT (0), "is_mastered" boolean NOT NULL DEFAULT (0), "last_seen" datetime, CONSTRAINT "UQ_385c9e4178bc09eed39074ec563" UNIQUE ("item_key"))`,
      `CREATE TABLE IF NOT EXISTS "france_sessions" ("id" varchar PRIMARY KEY NOT NULL, "difficulty" varchar NOT NULL, "question_types" varchar, "regions" varchar, "timer_seconds" integer NOT NULL DEFAULT (0), "correct_answers" integer, "total_questions" integer, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
      `CREATE TABLE IF NOT EXISTS "geo_progression" ("id" varchar PRIMARY KEY NOT NULL, "item_key" varchar NOT NULL, "correct_count" integer NOT NULL DEFAULT (0), "incorrect_count" integer NOT NULL DEFAULT (0), "is_mastered" boolean NOT NULL DEFAULT (0), "last_seen" datetime, CONSTRAINT "UQ_c089c516ff4a2aa7229df80521c" UNIQUE ("item_key"))`,
      `CREATE TABLE IF NOT EXISTS "geo_sessions" ("id" varchar PRIMARY KEY NOT NULL, "difficulty" varchar NOT NULL, "question_types" varchar, "continents" varchar, "capital_direction" varchar NOT NULL DEFAULT ('forward'), "timer_seconds" integer NOT NULL DEFAULT (0), "correct_answers" integer, "total_questions" integer, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
      `CREATE TABLE IF NOT EXISTS "heure_progression" ("id" varchar PRIMARY KEY NOT NULL, "answer_value" integer NOT NULL, "correct_count" integer NOT NULL DEFAULT (0), "incorrect_count" integer NOT NULL DEFAULT (0), "is_mastered" boolean NOT NULL DEFAULT (0), "last_seen" datetime, CONSTRAINT "UQ_e7311a1299178dec0bc62dfb6ca" UNIQUE ("answer_value"))`,
      `CREATE TABLE IF NOT EXISTS "heure_sessions" ("id" varchar PRIMARY KEY NOT NULL, "difficulty" varchar NOT NULL, "numeral_type" varchar NOT NULL DEFAULT ('arabic'), "timer_seconds" integer NOT NULL DEFAULT (0), "correct_answers" integer, "total_questions" integer, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
      `CREATE TABLE IF NOT EXISTS "imagier_progression" ("id" varchar PRIMARY KEY NOT NULL, "word_id" varchar NOT NULL, "correct_count" integer NOT NULL DEFAULT (0), "incorrect_count" integer NOT NULL DEFAULT (0), "is_mastered" boolean NOT NULL DEFAULT (0), "mastered_at" datetime, "last_seen" datetime, CONSTRAINT "UQ_521d86cdbf324354315a677ca52" UNIQUE ("word_id"))`,
      `CREATE TABLE IF NOT EXISTS "imagier_sessions" ("id" varchar PRIMARY KEY NOT NULL, "started_at" datetime NOT NULL DEFAULT (datetime('now')), "completed_at" datetime, "total_questions" integer, "correct_answers" integer, "mode" varchar, "difficulty" varchar, "categories" varchar)`,
      `CREATE TABLE IF NOT EXISTS "imagier_words" ("id" varchar PRIMARY KEY NOT NULL, "slug" varchar NOT NULL, "fr" varchar NOT NULL, "en" varchar NOT NULL, "category" varchar NOT NULL, "subcategory" varchar, "image_filename" varchar, "is_active" boolean NOT NULL DEFAULT (0), "created_at" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_f19b1032acf025c2fd1b9adbdd6" UNIQUE ("slug"))`,
      `CREATE TABLE IF NOT EXISTS "invitations" ("id" varchar PRIMARY KEY NOT NULL, "token" varchar NOT NULL, "label" varchar NOT NULL, "created_at" datetime NOT NULL DEFAULT (datetime('now')), "used_at" datetime, CONSTRAINT "UQ_e577dcf9bb6d084373ed3998509" UNIQUE ("token"))`,
      `CREATE TABLE IF NOT EXISTS "lecture_progressions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "text_id" integer NOT NULL, "play_count" integer NOT NULL DEFAULT (0), "last_played_at" datetime, "best_correct" integer NOT NULL DEFAULT (0), "best_total" integer NOT NULL DEFAULT (0), CONSTRAINT "UQ_e26002716996be90731def60291" UNIQUE ("text_id"))`,
      `CREATE TABLE IF NOT EXISTS "lecture_questions" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "text_id" integer NOT NULL, "question" text NOT NULL, "answer" text NOT NULL, "distractors" text NOT NULL, "excerpt" text, "ordre" integer NOT NULL DEFAULT (0), CONSTRAINT "FK_7915a3c965a3db21ea736490991" FOREIGN KEY ("text_id") REFERENCES "lecture_texts" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
      `CREATE TABLE IF NOT EXISTS "lecture_sessions" ("id" varchar PRIMARY KEY NOT NULL, "text_id" integer NOT NULL, "difficulty" varchar NOT NULL, "correct_answers" integer, "total_questions" integer, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
      `CREATE TABLE IF NOT EXISTS "lecture_texts" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "titre" varchar NOT NULL, "contenu" text NOT NULL, "actif" boolean NOT NULL DEFAULT (1), "created_at" datetime NOT NULL DEFAULT (datetime('now')))`,
      `CREATE TABLE IF NOT EXISTS "memory_sessions" ("id" varchar PRIMARY KEY NOT NULL, "pairs_count" integer NOT NULL, "mode" varchar NOT NULL, "categories" text NOT NULL, "attempts" integer, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
      `CREATE TABLE IF NOT EXISTS "modules" ("id" varchar PRIMARY KEY NOT NULL, "name" varchar NOT NULL, "description" varchar, "icon" varchar, "is_active" boolean NOT NULL DEFAULT (0), "display_order" integer NOT NULL DEFAULT (0), "created_at" datetime NOT NULL DEFAULT (datetime('now')))`,
      `CREATE TABLE IF NOT EXISTS "monnaie_progression" ("id" varchar PRIMARY KEY NOT NULL, "exercise_type" varchar NOT NULL, "answer_value" integer NOT NULL, "correct_count" integer NOT NULL DEFAULT (0), "incorrect_count" integer NOT NULL DEFAULT (0), "is_mastered" boolean NOT NULL DEFAULT (0), "last_seen" datetime, CONSTRAINT "UQ_582767f6b3b37fc2b496098c49c" UNIQUE ("exercise_type", "answer_value"))`,
      `CREATE TABLE IF NOT EXISTS "monnaie_sessions" ("id" varchar PRIMARY KEY NOT NULL, "exercise_type" varchar NOT NULL, "timer_seconds" integer NOT NULL DEFAULT (0), "correct_answers" integer, "total_questions" integer, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
      `CREATE TABLE IF NOT EXISTS "numeration_progression" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "play_count" integer NOT NULL DEFAULT (0), "last_played_at" datetime, "best_correct" integer NOT NULL DEFAULT (0), "best_total" integer NOT NULL DEFAULT (0))`,
      `CREATE TABLE IF NOT EXISTS "numeration_sessions" ("id" varchar PRIMARY KEY NOT NULL, "correct_answers" integer, "total_questions" integer, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
      `CREATE TABLE IF NOT EXISTS "pendu_sessions" ("id" varchar PRIMARY KEY NOT NULL, "word_id" text NOT NULL, "word" text NOT NULL, "difficulty" text NOT NULL, "won" boolean, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
      `CREATE TABLE IF NOT EXISTS "pendu_words" ("id" varchar PRIMARY KEY NOT NULL, "word" text NOT NULL, "difficulty" text NOT NULL, "is_active" boolean NOT NULL DEFAULT (1), "created_at" datetime NOT NULL DEFAULT (datetime('now')))`,
      `CREATE TABLE IF NOT EXISTS "settings" ("key" varchar PRIMARY KEY NOT NULL, "value" varchar NOT NULL)`,
      `CREATE TABLE IF NOT EXISTS "tables_progression" ("id" varchar PRIMARY KEY NOT NULL, "factor_a" integer NOT NULL, "factor_b" integer NOT NULL, "correct_count" integer NOT NULL DEFAULT (0), "incorrect_count" integer NOT NULL DEFAULT (0), "is_mastered" boolean NOT NULL DEFAULT (0), "mastered_at" datetime, "last_seen" datetime)`,
      `CREATE TABLE IF NOT EXISTS "tables_sessions" ("id" varchar PRIMARY KEY NOT NULL, "selected_tables" text NOT NULL, "total_questions" integer, "correct_answers" integer, "started_at" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "completed_at" datetime)`,
    ];
    for (const statement of statements) {
      await queryRunner.query(statement);
    }
  }

  public async down(): Promise<void> {
    // Volontairement bloquant : "revenir avant" la baseline signifierait supprimer toutes les
    // tables, donc toute la progression. Aucun scénario légitime ne le demande.
    throw new Error(
      'La migration de référence ne peut pas être annulée : elle supprimerait toutes les données. ' +
        'Pour repartir de zéro, supprimer le fichier de base de données après en avoir fait une sauvegarde.',
    );
  }
}
