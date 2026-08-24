import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Setting } from './entities/setting.entity';

const DEFAULTS = {
  // ── Paramètres globaux (tous modules) ──────────────────────────────────────
  questions_per_session: '10',
  question_timer_seconds: '0',
  mastery_threshold: '10',
  // ── Français (conjugaison, orthographe…) ──────────────────────────────────
  accent_tolerance: 'false',
  // ── Géographie ────────────────────────────────────────────────────────────
  geo_countries_filter: '',
  geo_question_types_filter: '',
  geo_country_presets: '[]',
  // ── Tables de multiplication ───────────────────────────────────────────────
  tables_include_trivial: 'true',
  // ── Calcul Mental ──────────────────────────────────────────────────────────
  calcul_min_value: '0',
  calcul_max_value: '20',
  // ── Monnaie ────────────────────────────────────────────────────────────────
  monnaie_denominations: '1,2,5,10,20,50,100,200,500,1000,2000,5000',
  monnaie_max_amount: '10',
  monnaie_whole_euros: 'false',
  monnaie_items_count: '3',
};

/**
 * Réglages admin par-module devenus des choix de pré-jeu enfant (difficulté, sens de
 * traduction Imagier, mode de réponse). Supprimés en base au démarrage.
 */
const OBSOLETE_KEYS = [
  'imagier_default_difficulty',
  'imagier_default_mode',
  'tables_choice_count',
  'monnaie_response_mode',
];

const PRIVATE_KEY_PATTERN = /(hash|secret|token)/i;

export function isPrivateKey(key: string): boolean {
  return PRIVATE_KEY_PATTERN.test(key);
}

@Injectable()
export class SettingsService implements OnModuleInit {
  constructor(
    @InjectRepository(Setting)
    private readonly repo: Repository<Setting>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  private async seed() {
    // PIN hash — seulement si absent
    const pinExists = await this.repo.findOneBy({ key: 'admin_pin_hash' });
    if (!pinExists) {
      const defaultPin = this.configService.get<string>('defaultPin') ?? '1234';
      const hash = await bcrypt.hash(defaultPin, 10);
      await this.repo.save({ key: 'admin_pin_hash', value: hash });
    }

    // Autres valeurs par défaut
    for (const [key, value] of Object.entries(DEFAULTS)) {
      const exists = await this.repo.findOneBy({ key });
      if (!exists) {
        await this.repo.save({ key, value });
      }
    }

    // Nettoyage des clés obsolètes
    for (const key of OBSOLETE_KEYS) {
      await this.repo.delete({ key });
    }
  }

  /**
   * Réglages exposés à l'API. `admin_pin_hash` en était : n'importe quel appareil invité
   * pouvait le lire, puis casser hors ligne un code à 4 chiffres — puis changer le PIN.
   *
   * Le filtre est structurel plutôt qu'une liste nominative : tout réglage dont la clé
   * contient `hash`, `secret` ou `token` reste privé. Un futur secret nommé selon cette
   * convention est protégé sans qu'on ait à y penser.
   */
  async getPublic(): Promise<Setting[]> {
    const all = await this.repo.find();
    return all.filter((setting) => !isPrivateKey(setting.key));
  }

  /** Tous les réglages, secrets compris. Usage interne uniquement — jamais exposé par un contrôleur. */
  async getAll(): Promise<Setting[]> {
    return this.repo.find();
  }

  async get(key: string): Promise<string | null> {
    const setting = await this.repo.findOneBy({ key });
    return setting?.value ?? null;
  }

  async set(key: string, value: string): Promise<Setting> {
    await this.repo.upsert({ key, value }, ['key']);
    return this.repo.findOneByOrFail({ key });
  }
}
