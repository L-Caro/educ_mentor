/**
 * Script de migration des images depuis generateur_carte vers backend/data/images/imagier/
 *
 * Usage : npx ts-node scripts/migrate-images.ts
 *
 * - Copie tous les fichiers images depuis generateur_carte/image anglais/[CATEGORIE]/
 *   vers backend/data/images/imagier/[categorie-normalisee]/
 * - Ne renomme PAS les fichiers (le nom original est conservé)
 * - Ne réécrase pas les fichiers existants (safe à relancer)
 */

import * as fs from 'fs';
import * as path from 'path';

const SOURCE_ROOT = path.resolve(__dirname, '../../generateur_carte/image anglais');
const DEST_ROOT = path.resolve(__dirname, '../data/images/imagier');

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function copyDir(srcDir: string, destDir: string): { copied: number; skipped: number } {
  let copied = 0;
  let skipped = 0;

  if (!fs.existsSync(srcDir)) return { copied, skipped };

  fs.mkdirSync(destDir, { recursive: true });

  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      // Sous-dossier : on aplatit (on ne crée pas de sous-dossiers côté dest)
      // Les images vont directement dans le dossier parent normalisé
      const result = copyDir(srcPath, destDir);
      copied += result.copied;
      skipped += result.skipped;
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (!['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'].includes(ext)) continue;

      if (fs.existsSync(destPath)) {
        skipped++;
        continue;
      }

      fs.copyFileSync(srcPath, destPath);
      copied++;
    }
  }

  return { copied, skipped };
}

function main() {
  if (!fs.existsSync(SOURCE_ROOT)) {
    console.error(`Source introuvable : ${SOURCE_ROOT}`);
    process.exit(1);
  }

  console.log(`Source : ${SOURCE_ROOT}`);
  console.log(`Destination : ${DEST_ROOT}`);
  console.log('');

  const categories = fs.readdirSync(SOURCE_ROOT, { withFileTypes: true })
    .filter((e) => e.isDirectory());

  let totalCopied = 0;
  let totalSkipped = 0;

  for (const cat of categories) {
    const srcDir = path.join(SOURCE_ROOT, cat.name);
    const destDirName = normalize(cat.name);
    const destDir = path.join(DEST_ROOT, destDirName);

    const { copied, skipped } = copyDir(srcDir, destDir);
    totalCopied += copied;
    totalSkipped += skipped;

    console.log(`  ${cat.name} → ${destDirName} : ${copied} copiés, ${skipped} ignorés`);
  }

  console.log('');
  console.log(`Total : ${totalCopied} fichiers copiés, ${totalSkipped} ignorés`);
}

main();
