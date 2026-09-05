import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import { MemoryCard } from './entities/memory-card.entity';

interface SeedCard {
  id: string;
  fr: string;
  en: string;
  image: string;
}

/**
 * Au premier démarrage sur une table vide : insère les cartes de `memory-card.seed.json` et
 * copie leurs images (versionnées dans `seed-images/`) vers `<imagesPath>/memory/`, servi à
 * `/media/memory/`. Idempotent : ne fait rien si la table contient déjà des lignes.
 */
@Injectable()
export class MemoryCardSeedService implements OnModuleInit {
  private readonly logger = new Logger('MemoryCardSeed');
  private readonly seedDir = __dirname;
  private readonly imagesTarget: string;

  constructor(
    @InjectRepository(MemoryCard)
    private readonly cardRepo: Repository<MemoryCard>,
    configService: ConfigService,
  ) {
    this.imagesTarget = path.resolve(
      configService.get<string>('imagesPath')!,
      'memory',
    );
  }

  async onModuleInit(): Promise<void> {
    if ((await this.cardRepo.count()) > 0) return;

    const seedPath = path.join(this.seedDir, 'memory-card.seed.json');
    if (!fs.existsSync(seedPath)) {
      this.logger.warn(
        `Seed introuvable (${seedPath}) : module Memory sans cartes.`,
      );
      return;
    }

    const seed = JSON.parse(await fsp.readFile(seedPath, 'utf8')) as SeedCard[];
    await fsp.mkdir(this.imagesTarget, { recursive: true });

    let copied = 0;
    const cards: MemoryCard[] = [];
    for (const entry of seed) {
      let imageFilename: string | undefined;
      if (entry.image) {
        const source = path.join(this.seedDir, 'seed-images', entry.image);
        if (fs.existsSync(source)) {
          await fsp.copyFile(source, path.join(this.imagesTarget, entry.image));
          imageFilename = entry.image;
          copied++;
        }
      }
      cards.push(
        this.cardRepo.create({
          id: entry.id,
          fr: entry.fr,
          en: entry.en,
          image_filename: imageFilename,
          category: 'animaux',
        }),
      );
    }

    await this.cardRepo.save(cards);
    this.logger.log(
      `${cards.length} cartes Memory insérées, ${copied} images copiées vers ${this.imagesTarget}.`,
    );
  }
}
