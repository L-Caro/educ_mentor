import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { ImagierWord } from './entities/imagier-word.entity';

export interface ImportReport {
  inserted: number;
  skipped: number;
  errors: string[];
}

type DictionaryValue = string | Record<string, string>;
type DictionaryCategory = Record<string, DictionaryValue>;

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-z0-9]/g, '-')      // remplace tout non-alphanumérique par -
    .replace(/-+/g, '-')             // collapse les - multiples
    .replace(/^-|-$/g, '');          // retire les - en début/fin
}

@Injectable()
export class ImagierImportService {
  private readonly imagesBasePath: string;

  constructor(
    @InjectRepository(ImagierWord)
    private readonly wordRepo: Repository<ImagierWord>,
    private readonly configService: ConfigService,
  ) {
    this.imagesBasePath = path.resolve(
      configService.get<string>('imagesPath')!,
      'imagier',
    );
  }

  async importFromJson(jsonStr: string, overwrite = false): Promise<ImportReport> {
    const report: ImportReport = { inserted: 0, skipped: 0, errors: [] };

    let dict: Record<string, unknown>;
    try {
      const parsed = JSON.parse(jsonStr);
      dict = (parsed.dictionnaire_thematique ?? parsed) as Record<string, unknown>;
    } catch {
      report.errors.push('JSON invalide');
      return report;
    }

    for (const [category, categoryData] of Object.entries(dict)) {
      if (typeof categoryData !== 'object' || categoryData === null) continue;

      for (const [subOrFr, subOrEn] of Object.entries(categoryData as DictionaryCategory)) {
        if (typeof subOrEn === 'string') {
          // Structure plate : subOrFr = mot FR, subOrEn = mot EN
          await this.processWord(subOrFr, subOrEn, category, undefined, overwrite, report);
        } else if (typeof subOrEn === 'object' && subOrEn !== null) {
          // Structure imbriquée : subOrFr = sous-catégorie
          for (const [fr, en] of Object.entries(subOrEn as Record<string, string>)) {
            await this.processWord(fr, en, category, subOrFr, overwrite, report);
          }
        }
      }
    }

    return report;
  }

  private async processWord(
    fr: string,
    en: string,
    category: string,
    subcategory: string | undefined,
    overwrite: boolean,
    report: ImportReport,
  ) {
    try {
      const slug = normalize(fr);
      const existing = await this.wordRepo.findOneBy({ slug });

      if (existing && !overwrite) {
        report.skipped++;
        return;
      }

      const image_filename = this.findImage(fr, category);

      const word: Partial<ImagierWord> = {
        id: existing?.id ?? uuidv4(),
        slug,
        fr,
        en,
        category: normalize(category),
        subcategory,
        image_filename: image_filename ?? undefined,
        is_active: existing?.is_active ?? false,
      };

      await this.wordRepo.save(word);
      report.inserted++;
    } catch (e) {
      report.errors.push(`Erreur pour "${fr}": ${(e as Error).message}`);
    }
  }

  /**
   * Cherche un fichier image dont le nom (sans extension) correspond au mot FR.
   * Cherche d'abord dans le dossier de la catégorie, puis dans tous les dossiers.
   */
  findImage(fr: string, category: string): string | null {
    if (!fs.existsSync(this.imagesBasePath)) return null;

    const frNormalized = normalize(fr);

    // Lire tous les dossiers disponibles une seule fois
    let allDirs: string[] = [];
    try {
      allDirs = fs.readdirSync(this.imagesBasePath, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);
    } catch {
      return null;
    }

    // 1. Cherche d'abord dans le dossier qui correspond à la catégorie
    //    (comparaison insensible à la casse via normalize)
    const categoryDirName = allDirs.find((d) => normalize(d) === normalize(category));
    if (categoryDirName) {
      const found = this.searchInDir(
        path.join(this.imagesBasePath, categoryDirName),
        fr,
        frNormalized,
      );
      if (found) return found;
    }

    // 2. Fallback : cherche dans tous les autres dossiers
    for (const dir of allDirs) {
      if (categoryDirName && dir === categoryDirName) continue; // déjà cherché
      const found = this.searchInDir(
        path.join(this.imagesBasePath, dir),
        fr,
        frNormalized,
      );
      if (found) return found;
    }

    return null;
  }

  private searchInDir(dir: string, frOriginal: string, frNormalized: string): string | null {
    if (!fs.existsSync(dir)) return null;

    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const nameWithoutExt = path.parse(file).name;
        if (
          normalize(nameWithoutExt) === frNormalized ||
          nameWithoutExt.toLowerCase() === frOriginal.toLowerCase()
        ) {
          return file;
        }
      }
    } catch {
      // ignore
    }
    return null;
  }

  /**
   * Retourne le chemin relatif de l'image pour construire l'URL.
   * ex: { category: 'animaux', filename: 'chat.webp' }
   */
  resolveImageCategory(imageFilename: string, wordCategory: string): string | null {
    if (!fs.existsSync(this.imagesBasePath)) return null;

    // Cherche dans quel dossier se trouve réellement le fichier
    try {
      const dirs = fs.readdirSync(this.imagesBasePath, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name);

      for (const dir of dirs) {
        const filePath = path.join(this.imagesBasePath, dir, imageFilename);
        if (fs.existsSync(filePath)) return dir;
      }
    } catch {
      // ignore
    }

    return normalize(wordCategory);
  }
}
