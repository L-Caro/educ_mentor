import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DicteeItem } from './entities/dictee-item.entity';
import { DicteeSession } from './entities/dictee-session.entity';
import { isNiveau } from './dictee.logic';

export interface DicteeImportOptions {
  /** Vide items + sessions avant d'importer (repartir de zéro). */
  replace?: boolean;
  /** Marque les items importés comme actifs (jouables). */
  activate?: boolean;
}

export interface DicteeImportReport {
  inserted: number;
  skipped: number;
  replaced: boolean;
  errors: string[];
}

interface RawItem {
  niveau: string;
  contenu: string;
  notions: string[];
}

/** Valide un item brut du JSON. Retourne l'item nettoyé ou une chaîne d'erreur. */
function parseItem(value: unknown, index: number): RawItem | string {
  if (typeof value !== 'object' || value === null) {
    return `Item ${index + 1} : objet attendu`;
  }
  const record = value as Record<string, unknown>;

  if (!isNiveau(record.niveau)) {
    return `Item ${index + 1} : "niveau" doit valoir debutant, normal ou difficile`;
  }
  if (typeof record.contenu !== 'string' || !record.contenu.trim()) {
    return `Item ${index + 1} : "contenu" manquant ou vide`;
  }

  let notions: string[] = [];
  if (record.notions !== undefined) {
    if (
      !Array.isArray(record.notions) ||
      record.notions.some((notion) => typeof notion !== 'string')
    ) {
      return `Item ${index + 1} : "notions" doit être un tableau de chaînes`;
    }
    notions = (record.notions as string[])
      .map((notion) => notion.trim())
      .filter(Boolean);
  }

  return { niveau: record.niveau, contenu: record.contenu.trim(), notions };
}

@Injectable()
export class DicteeImportService {
  constructor(
    @InjectRepository(DicteeItem)
    private readonly itemRepo: Repository<DicteeItem>,
    @InjectRepository(DicteeSession)
    private readonly sessionRepo: Repository<DicteeSession>,
  ) {}

  async importFromJson(
    jsonStr: string,
    options: DicteeImportOptions = {},
  ): Promise<DicteeImportReport> {
    const report: DicteeImportReport = {
      inserted: 0,
      skipped: 0,
      replaced: false,
      errors: [],
    };

    // 1. Parser et valider entièrement AVANT tout écriture : un JSON cassé ne doit
    //    jamais déclencher le `replace`.
    let rawItems: unknown[];
    try {
      const parsed: unknown = JSON.parse(jsonStr);
      const root =
        typeof parsed === 'object' &&
        parsed !== null &&
        Array.isArray((parsed as { items?: unknown }).items)
          ? (parsed as { items: unknown[] }).items
          : parsed;
      if (!Array.isArray(root)) {
        report.errors.push('JSON invalide : tableau `items` attendu');
        return report;
      }
      rawItems = root;
    } catch {
      report.errors.push('JSON invalide');
      return report;
    }

    if (rawItems.length === 0) {
      report.errors.push('Aucun item dans le JSON');
      return report;
    }

    const parsed: RawItem[] = [];
    for (const [index, raw] of rawItems.entries()) {
      const result = parseItem(raw, index);
      if (typeof result === 'string') {
        report.errors.push(result);
      } else {
        parsed.push(result);
      }
    }
    if (report.errors.length > 0) return report;

    // 2. Remplacement éventuel, une fois le JSON sûr.
    if (options.replace) {
      await this.itemRepo.manager.transaction(async (manager) => {
        await manager.getRepository(DicteeSession).clear();
        await manager.getRepository(DicteeItem).clear();
      });
      report.replaced = true;
    }

    // 3. Insertion. Hors remplacement, on ignore un item identique (même niveau + contenu)
    //    déjà présent, pour qu'un réimport ne fasse pas doublon.
    for (const item of parsed) {
      const existing = options.replace
        ? null
        : await this.itemRepo.findOneBy({
            niveau: item.niveau,
            contenu: item.contenu,
          });
      if (existing) {
        report.skipped++;
        continue;
      }
      await this.itemRepo.save(
        this.itemRepo.create({
          id: randomUUID(),
          niveau: item.niveau,
          contenu: item.contenu,
          notions: item.notions,
          is_active: options.activate ?? false,
        }),
      );
      report.inserted++;
    }

    return report;
  }
}
