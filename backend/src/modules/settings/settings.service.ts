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
  // ── Imagier ────────────────────────────────────────────────────────────────
  imagier_default_difficulty: 'level_1',
  imagier_default_mode: 'fr_to_en',
  // ── Tables de multiplication ───────────────────────────────────────────────
  tables_known_tables: '[0,1,2,5,9,10]',
  tables_choice_count: '4',
  tables_hints_enabled: 'true',
  tables_include_trivial: 'true',
  // ── Calcul Mental ──────────────────────────────────────────────────────────
  calcul_min_value: '0',
  calcul_max_value: '20',
  calcul_operation_types: 'complement,addition,soustraction',
  // ── Monnaie ────────────────────────────────────────────────────────────────
  monnaie_denominations: '1,2,5,10,20,50,100,200,500,1000,2000,5000',
  monnaie_max_amount: '10',
  monnaie_whole_euros: 'false',
  monnaie_items_count: '3',
  monnaie_response_mode: 'free',
};

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
  }

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
