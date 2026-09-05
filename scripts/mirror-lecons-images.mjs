/**
 * Miroir local des images du corpus de leçons.
 *
 * Pourquoi : les 448 leçons de data/lecons/ hotlinkent leurs illustrations sur
 * media-image.kartable.fr. Ces URLs pointent vers un bucket de *dérivés* (?format=webp)
 * dont les objets portent un `x-amz-expiration` glissant (~7 jours, même rule-id pour tous).
 * Ce sont des adresses de cache, pas des adresses stables : elles peuvent changer de forme,
 * bloquer le referer ou disparaître. On fige donc le corpus en local une fois pour toutes.
 *
 * Ce script alimente le CORPUS DE TRAVAIL, pas l'application :
 * - sortie dans data/lecons_media/ (gitignoré, hors du chemin servi à /media/)
 * - rien de ce qui est téléchargé ici n'a vocation à être livré tel quel à l'enfant
 *
 * Usage :
 *   node scripts/mirror-lecons-images.mjs           # télécharge ce qui manque
 *   node scripts/mirror-lecons-images.mjs --dry-run # inventorie sans rien télécharger
 *   node scripts/mirror-lecons-images.mjs --force   # re-télécharge tout
 *
 * Reprise : le script est idempotent. Un fichier déjà présent avec la bonne taille est sauté,
 * donc une interruption (Ctrl-C, réseau coupé) se rattrape en relançant la même commande.
 */

import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { join, dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const LECONS_DIR = join(ROOT, 'data/lecons');
const OUT_DIR = join(ROOT, 'data/lecons_media');
const MANIFEST = join(OUT_DIR, 'manifest.json');

// Hôtes dont on accepte de faire un miroir. Tout le reste (CDN de scripts, etc.) est ignoré.
const IMAGE_HOSTS = new Set(['media-image.kartable.fr', 'media.kartable.fr']);

const CONCURRENCY = 6;      // rester poli : ce sont les serveurs de quelqu'un d'autre
const MAX_RETRIES = 3;
const TIMEOUT_MS = 30_000;
const USER_AGENT = 'educmentor-corpus-mirror/1.0 (usage privé, archivage local)';

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const FORCE = args.has('--force');

// ─── 1. Inventaire : quelles images, référencées par quelles leçons ────────────

/** Parcours récursif : renvoie tous les chemins de fichiers .html sous `dir`. */
async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return listHtmlFiles(full);
      return entry.isFile() && full.endsWith('.html') ? [full] : [];
    }),
  );
  return files.flat();
}

/**
 * Nom de fichier local : hash de l'URL complète.
 * On ne réutilise pas le basename d'origine parce que deux URLs peuvent le partager
 * en ne différant que par leur query (`?format=webp`, `?1597322999`) : la lisibilité
 * est assurée par le manifeste, pas par le nom de fichier.
 */
function localName(url, contentType) {
  const hash = createHash('sha1').update(url).digest('hex').slice(0, 16);
  const ext = extFor(url, contentType);
  return `${hash}${ext}`;
}

function extFor(url, contentType) {
  const fromType = {
    'image/webp': '.webp',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/svg+xml': '.svg',
  }[(contentType ?? '').split(';')[0].trim()];
  if (fromType) return fromType;

  // Repli sur l'extension du chemin : attention, elle ment quand il y a ?format=webp
  const pathExt = extname(new URL(url).pathname).toLowerCase();
  return pathExt || '.bin';
}

async function buildInventory() {
  const htmlFiles = await listHtmlFiles(LECONS_DIR);
  const inventory = new Map(); // url → { sources: Set<string> }

  for (const file of htmlFiles) {
    const content = await readFile(file, 'utf-8');
    const source = relative(ROOT, file);

    for (const match of content.matchAll(/src="(https?:\/\/[^"]+)"/g)) {
      const url = match[1];
      let host;
      try {
        host = new URL(url).host;
      } catch {
        continue; // URL malformée dans le HTML source : on l'ignore, on ne plante pas
      }
      if (!IMAGE_HOSTS.has(host)) continue;

      if (!inventory.has(url)) inventory.set(url, { sources: new Set() });
      inventory.get(url).sources.add(source);
    }
  }

  return { htmlFiles, inventory };
}

// ─── 2. Téléchargement ─────────────────────────────────────────────────────────

async function fetchWithRetry(url) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': USER_AGENT, Accept: 'image/*' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      return {
        buffer: Buffer.from(await response.arrayBuffer()),
        contentType: response.headers.get('content-type'),
        expiration: response.headers.get('x-amz-expiration'),
      };
    } catch (error) {
      lastError = error;
      // Backoff exponentiel : 500ms, 1s, 2s, inutile de marteler un serveur qui tousse
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
      }
    }
  }

  throw lastError;
}

/** Exécute `worker` sur chaque tâche, `limit` en parallèle au maximum. */
async function runPool(tasks, limit, worker) {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, tasks.length) }, async () => {
    while (cursor < tasks.length) {
      const index = cursor++;
      await worker(tasks[index], index);
    }
  });
  await Promise.all(runners);
}

// ─── 3. Orchestration ──────────────────────────────────────────────────────────

async function loadManifest() {
  if (FORCE) return {};
  try {
    return JSON.parse(await readFile(MANIFEST, 'utf-8')).images ?? {};
  } catch {
    return {}; // premier passage : pas encore de manifeste
  }
}

/** Un fichier déjà téléchargé compte comme fait s'il existe et n'est pas vide. */
async function alreadyDone(entry) {
  if (!entry?.file) return false;
  try {
    const info = await stat(join(OUT_DIR, entry.file));
    return info.size > 0 && info.size === entry.bytes;
  } catch {
    return false;
  }
}

async function main() {
  console.log('Inventaire du corpus…');
  const { htmlFiles, inventory } = await buildInventory();
  const urls = [...inventory.keys()];

  console.log(`  ${htmlFiles.length} leçons scannées`);
  console.log(`  ${urls.length} images uniques référencées`);

  if (DRY_RUN) {
    const byHost = {};
    for (const url of urls) {
      const host = new URL(url).host;
      byHost[host] = (byHost[host] ?? 0) + 1;
    }
    console.log('\n  Par hôte :');
    for (const [host, count] of Object.entries(byHost)) console.log(`    ${count}\t${host}`);
    console.log('\n--dry-run : rien téléchargé.');
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  const previous = await loadManifest();

  const images = {};
  const stats = { downloaded: 0, skipped: 0, failed: 0, bytes: 0 };
  const failures = [];

  await runPool(urls, CONCURRENCY, async (url, index) => {
    const sources = [...inventory.get(url).sources].sort();
    const known = previous[url];

    if (await alreadyDone(known)) {
      images[url] = { ...known, sources };
      stats.skipped++;
      return;
    }

    try {
      const { buffer, contentType, expiration } = await fetchWithRetry(url);
      const file = localName(url, contentType);
      await writeFile(join(OUT_DIR, file), buffer);

      images[url] = {
        file,
        bytes: buffer.length,
        contentType: (contentType ?? '').split(';')[0].trim() || null,
        // Conservé à titre de preuve : c'est ce header qui justifie l'existence de ce miroir
        upstreamExpiration: expiration ?? null,
        sources,
      };
      stats.downloaded++;
      stats.bytes += buffer.length;
    } catch (error) {
      stats.failed++;
      failures.push({ url, error: String(error?.message ?? error), sources });
    }

    const done = stats.downloaded + stats.skipped + stats.failed;
    if (done % 100 === 0 || done === urls.length) {
      process.stdout.write(`\r  ${done}/${urls.length}…`);
    }
  });

  await mkdir(dirname(MANIFEST), { recursive: true });
  await writeFile(
    MANIFEST,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), count: Object.keys(images).length, images, failures }, null, 2)}\n`,
  );

  const mb = (stats.bytes / 1024 / 1024).toFixed(1);
  console.log(`\n\nTéléchargées : ${stats.downloaded} (${mb} Mo)`);
  console.log(`Déjà présentes : ${stats.skipped}`);
  console.log(`Échecs : ${stats.failed}`);
  if (failures.length > 0) {
    console.log('\nÉchecs (relancer la commande pour réessayer) :');
    for (const failure of failures.slice(0, 10)) console.log(`  ${failure.error}\t${failure.url}`);
    if (failures.length > 10) console.log(`  … et ${failures.length - 10} autres (détail dans le manifeste)`);
  }
  console.log(`\nManifeste : ${relative(ROOT, MANIFEST)}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
