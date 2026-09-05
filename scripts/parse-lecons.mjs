/**
 * Parse le corpus de leçons HTML en JSON structuré.
 *
 * Pourquoi : les 448 leçons de data/lecons/ sont des exports Angular de Kartable. Sous les
 * ~133 Ko de webfonts base64 de chaque fichier se cache un contenu très régulier : chaque bloc
 * pédagogique est un `<div class="bt bt_TYPE">` imbriqué, et le type porte la sémantique
 * (bt_definition, bt_piege, bt_resume, bt_exemple…). On extrait cette structure une fois pour
 * toutes ; plus personne n'a ensuite à toucher au HTML.
 *
 * Ce script alimente le CORPUS DE TRAVAIL, pas l'application. La sortie est du texte Kartable
 * réorganisé, pas du contenu livrable : elle sert de matière première à la rédaction des fiches.
 *
 * Prérequis : `node scripts/mirror-lecons-images.mjs` (les images sont résolues via son manifeste).
 *
 * Usage :
 *   node scripts/parse-lecons.mjs            # écrit data/corpus/
 *   node scripts/parse-lecons.mjs --stats    # n'écrit rien, affiche l'analyse du corpus
 *
 * Sorties :
 *   data/corpus/corpus.json   448 leçons en arbre de blocs typés
 *   data/corpus/index.json    le squelette : matières, niveaux, notions, progression spiralaire
 */

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { join, basename, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const LECONS_DIR = join(ROOT, 'data/lecons');
const MEDIA_MANIFEST = join(ROOT, 'data/lecons_media/manifest.json');
const OUT_DIR = join(ROOT, 'data/corpus');

const STATS_ONLY = process.argv.includes('--stats');

// ─── 1. Micro-parseur HTML ─────────────────────────────────────────────────────
// Le corpus est un export machine, figé et homogène : un tokenizer ciblé suffit et évite
// d'ajouter une dépendance pour un script one-shot. Il n'est pas prévu pour du HTML arbitraire.

const VOID_TAGS = new Set(['br', 'img', 'hr', 'meta', 'link', 'input', 'source', 'col']);
const TOKEN = /<(\/?)([a-zA-Z][\w-]*)((?:\s+[^<>]*?)?)\/?>|<!--[\s\S]*?-->/g;

function parseHtml(source) {
  const root = { tag: '#root', attrs: '', children: [] };
  const stack = [root];
  let cursor = 0;

  for (const match of source.matchAll(TOKEN)) {
    const between = source.slice(cursor, match.index);
    if (between.trim()) {
      stack.at(-1).children.push({ tag: '#text', text: between, attrs: '', children: [] });
    }
    cursor = match.index + match[0].length;

    if (match[0].startsWith('<!--')) continue;
    const [, closing, rawTag, attrs = ''] = match;
    const tag = rawTag.toLowerCase();

    if (closing) {
      // Remonte jusqu'à la balise ouvrante correspondante : tolère les balises non fermées
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const node = { tag, attrs, children: [] };
    stack.at(-1).children.push(node);
    if (!VOID_TAGS.has(tag) && !match[0].endsWith('/>')) stack.push(node);
  }

  return root;
}

function attr(node, name) {
  return new RegExp(`${name}="([^"]*)"`).exec(node.attrs)?.[1] ?? null;
}

function classList(node) {
  return (attr(node, 'class') ?? '').split(/\s+/).filter(Boolean);
}

/** Un bloc pédagogique Kartable : `<div class="bt bt_TYPE …">`. */
function isBlock(node) {
  return node.tag === 'div' && classList(node).includes('bt');
}

// ─── 2. Texte : HTML → markdown léger ──────────────────────────────────────────

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', eacute: 'é', egrave: 'è', ecirc: 'ê', agrave: 'à', ccedil: 'ç', ugrave: 'ù', ocirc: 'ô', icirc: 'î', laquo: '«', raquo: '»', hellip: '…', rsquo: '’', deg: '°', times: '×', divide: '÷', minus: '−' };

function decodeEntities(text) {
  return text.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (whole, body) => {
    if (body.startsWith('#x') || body.startsWith('#X')) return String.fromCodePoint(parseInt(body.slice(2), 16));
    if (body.startsWith('#')) return String.fromCodePoint(parseInt(body.slice(1), 10));
    return ENTITIES[body] ?? whole;
  });
}

/**
 * Les titres de fichiers sont doublement encodés (`Le son _&amp;eacute;_`) : deux passes
 * sont nécessaires. Le contenu des blocs ne l'est qu'une fois, mais une seconde passe est
 * inoffensive sur du texte déjà décodé.
 */
function decodeTwice(text) {
  return decodeEntities(decodeEntities(text)).replace(/ /g, ' ');
}

/**
 * Emballe un fragment dans des marqueurs markdown en **conservant les espaces extérieurs**.
 * Kartable écrit `<strong> le verbe </strong>` : trimmer sans réémettre les espaces collerait
 * les mots voisins ("phrase,**le verbe**sert").
 */
function wrap(inner, marker) {
  const core = inner.trim();
  if (!core) return inner;
  const lead = /^\s/.test(inner) ? ' ' : '';
  const tail = /\s$/.test(inner) ? ' ' : '';
  return `${lead}${marker}${core}${marker}${tail}`;
}

/** Rend un sous-arbre en markdown léger. Les blocs `bt_` imbriqués sont ignorés (traités à part). */
function renderMarkdown(node) {
  if (node.tag === '#text') return node.text.replace(/\s+/g, ' ');
  if (isBlock(node)) return '';

  const inner = node.children.map(renderMarkdown).join('');

  switch (node.tag) {
    case 'strong':
    case 'b':
      return wrap(inner, '**');
    case 'em':
    case 'i':
      return wrap(inner, '*');
    case 'sup':
      return inner.trim() ? `^${inner.trim()}` : inner;
    case 'br':
      return '\n';
    case 'li':
      return `\n- ${inner.trim()}`;
    case 'p':
    case 'ul':
    case 'ol':
    case 'div':
      return `${inner}\n\n`;
    case 'tr':
      return `${inner}|\n`;
    case 'td':
    case 'th':
      return `| ${inner.trim()} `;
    case 'img':
      return '';
    default:
      return inner;
  }
}

function cleanText(raw) {
  return decodeTwice(raw)
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── 3. Blocs : classification ─────────────────────────────────────────────────

/**
 * Rôle d'un bloc, dérivé de son type Kartable. C'est cette colonne qui rend le corpus
 * exploitable pour la rédaction des fiches : `key` alimente l'idée clé, `rule` la règle,
 * `warning` le piège, `example` l'exemple.
 */
const ROLES = {
  section: 'structure', section1: 'structure', section2: 'structure', section3: 'structure',
  title: 'structure', name: 'structure',
  text: 'body', img: 'media', exemple: 'example', general: 'body',
  definition: 'rule', propriete: 'rule', ortho_rule: 'rule', conj_rule: 'rule', gram_rule: 'rule',
  fundamental: 'rule', exceptions: 'rule',
  resume: 'key', memo: 'key', key_figure: 'key',
  astuce: 'tip', advice: 'tip', conseils: 'tip', remarque: 'tip',
  piege: 'warning',
  question: 'exercise', enonce: 'exercise', consigne: 'exercise', answer: 'exercise',
  answer_free: 'exercise', final_result: 'exercise', solving: 'exercise', solvingstep: 'exercise',
  source: 'meta',
};

/** Priorité de rôle quand un bloc cumule plusieurs types (ex : `bt_advice bt_piege` → warning). */
const ROLE_PRIORITY = ['warning', 'key', 'exercise', 'rule', 'example', 'tip', 'media', 'structure', 'body', 'meta'];

function blockRole(types) {
  const roles = types.map((type) => ROLES[type]).filter(Boolean);
  return ROLE_PRIORITY.find((role) => roles.includes(role)) ?? 'body';
}

/**
 * Construit l'arbre des blocs d'une leçon.
 *
 * Forme du DOM source, invariante sur les 448 fichiers :
 *   div.bt.bt_TYPE
 *     ├─ div                     charge utile propre au bloc
 *     ├─ div.image-container     pour bt_img
 *     └─ kartable-block*         blocs enfants (récursion)
 */
function extractBlocks(node, media, out = []) {
  for (const child of node.children) {
    if (isBlock(child)) {
      out.push(buildBlock(child, media));
    } else {
      extractBlocks(child, media, out);
    }
  }
  return out;
}

function buildBlock(node, media) {
  const types = classList(node).filter((name) => name.startsWith('bt_')).map((name) => name.slice(3));

  // Charge utile propre : les div directs qui ne sont pas eux-mêmes des blocs.
  const payload = node.children.filter((child) => child.tag === 'div' && !isBlock(child));
  const text = cleanText(payload.map(renderMarkdown).join(''));

  const images = [];
  collectImages(payload, media, images);

  const block = {
    id: attr(node, 'id'),
    types,
    role: blockRole(types),
  };

  // Les titres portent leur numérotation dans un <span> ("I", "II"…) : on la sépare du libellé.
  const heading = payload.flatMap((child) => findAll(child, (n) => /^h[1-6]$/.test(n.tag)))[0];
  if (heading) {
    const numbering = findAll(heading, (n) => n.tag === 'span').map((n) => cleanText(renderMarkdown(n)))[0];
    const full = cleanText(renderMarkdown(heading));
    block.title = numbering && full.startsWith(numbering) ? full.slice(numbering.length).trim() : full;
    if (numbering) block.numbering = numbering;
  } else if (text) {
    block.text = text;
  }

  if (images.length > 0) block.images = images;

  const children = extractBlocks(node, media);
  if (children.length > 0) block.children = children;

  return block;
}

function findAll(node, predicate, out = []) {
  if (predicate(node)) out.push(node);
  for (const child of node.children) findAll(child, predicate, out);
  return out;
}

function collectImages(nodes, media, out) {
  for (const node of nodes) {
    for (const img of findAll(node, (n) => n.tag === 'img')) {
      const url = attr(img, 'src');
      if (!url) continue;
      const mirrored = media[url];
      out.push({
        url,
        file: mirrored?.file ?? null, // null = image absente du miroir : relancer mirror-lecons-images
        bytes: mirrored?.bytes ?? null,
      });
    }
  }
}

// ─── 4. Titres et identifiants ─────────────────────────────────────────────────

/**
 * Les noms de fichiers ont subi une translittération à l'export : les caractères interdits
 * par le système de fichiers sont devenus des `_`. Trois motifs, tous non ambigus (31 titres) :
 *   " _ "            → " : "     "Napoléon _ de la République à l'Empire"
 *   "_mot_"          → "[mot]"   "Le son _ou_"  (notation phonétique)
 *   "»_«"            → "»/«"     "Les homophones « ou »_« où »"
 */
function restoreTitle(rawName) {
  return decodeTwice(rawName)
    .replace(/\s+_\s+/g, ' : ')
    .replace(/»_«/g, '»/«')
    .replace(/(^|\s)_([^_\s][^_]*)_(?=\s|$)/g, '$1[$2]')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(text) {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ─── 5. Assemblage d'une leçon ─────────────────────────────────────────────────

const PUBLICATION_RE = /Dernière modification :\s*<strong[^>]*>([^<]+)<\/strong>[\s\S]*?programme\s*<strong[^>]*>([^<]+)<\/strong>/;

function countStats(blocks, acc = { blocks: 0, words: 0, images: 0, sections: 0, byRole: {} }) {
  for (const block of blocks) {
    acc.blocks++;
    acc.byRole[block.role] = (acc.byRole[block.role] ?? 0) + 1;
    if (block.role === 'structure' && block.types.includes('section')) acc.sections++;
    if (block.text) acc.words += block.text.split(/\s+/).filter(Boolean).length;
    if (block.images) acc.images += block.images.length;
    if (block.children) countStats(block.children, acc);
  }
  return acc;
}

function parseLesson(filePath, source, media) {
  // Le gros du fichier est du CSS et des webfonts base64 : on l'écarte avant tout traitement.
  const body = source
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<head[\s\S]*?<\/head>/g, '');

  const relPath = relative(ROOT, filePath).split(/[\\/]/);
  const level = relPath[2];
  const subject = relPath[3];
  const title = restoreTitle(basename(filePath, extname(filePath)));

  const subjectSlug = slugify(subject.replace(/^Exercice /, ''));
  const titleSlug = slugify(title);
  const publication = PUBLICATION_RE.exec(body);

  const blocks = extractBlocks(parseHtml(body), media);

  return {
    id: `${level.toLowerCase()}.${subjectSlug}.${titleSlug}`,
    level,
    subject,
    subjectSlug,
    // Les dossiers "Exercice Mathématiques" sont la même matière, dans un registre applicatif
    kind: subject.startsWith('Exercice ') ? 'exercice' : 'lecon',
    title,
    titleSlug,
    sourceFile: relative(ROOT, filePath),
    lastModified: publication?.[1]?.trim() ?? null,
    program: publication?.[2]?.trim() ?? null,
    stats: countStats(blocks),
    blocks,
  };
}

// ─── 6. Le squelette : index et notions ────────────────────────────────────────

const LEVEL_ORDER = ['CE1', 'CE2', 'CM1', 'CM2'];

/**
 * Une notion = un (matière, titre) donné, vu à travers les niveaux où il apparaît.
 * 66 notions reviennent sur 2 à 4 niveaux : c'est la progression spiralaire du programme,
 * déjà encodée dans le corpus. C'est elle qui justifie une fiche *par niveau*.
 */
function buildIndex(lessons) {
  const notions = new Map();

  for (const lesson of lessons) {
    const key = `${lesson.subjectSlug}.${lesson.titleSlug}`;
    if (!notions.has(key)) {
      notions.set(key, { slug: key, title: lesson.title, subject: lesson.subjectSlug, levels: {} });
    }
    notions.get(key).levels[lesson.level] = lesson.id;
  }

  const notionList = [...notions.values()]
    .map((notion) => ({
      ...notion,
      levelCount: Object.keys(notion.levels).length,
      spiral: Object.keys(notion.levels).length > 1,
    }))
    .sort((a, b) => b.levelCount - a.levelCount || a.slug.localeCompare(b.slug));

  const subjects = new Map();
  for (const lesson of lessons) {
    if (!subjects.has(lesson.subjectSlug)) {
      subjects.set(lesson.subjectSlug, { slug: lesson.subjectSlug, labels: new Set(), lessons: 0, byLevel: {} });
    }
    const entry = subjects.get(lesson.subjectSlug);
    entry.labels.add(lesson.subject);
    entry.lessons++;
    entry.byLevel[lesson.level] = (entry.byLevel[lesson.level] ?? 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    levels: LEVEL_ORDER.filter((level) => lessons.some((lesson) => lesson.level === level)),
    subjects: [...subjects.values()]
      .map((entry) => ({ ...entry, labels: [...entry.labels] }))
      .sort((a, b) => b.lessons - a.lessons),
    notions: notionList,
    stats: {
      lessons: lessons.length,
      notions: notionList.length,
      spiralNotions: notionList.filter((notion) => notion.spiral).length,
      blocks: lessons.reduce((sum, lesson) => sum + lesson.stats.blocks, 0),
      words: lessons.reduce((sum, lesson) => sum + lesson.stats.words, 0),
      images: lessons.reduce((sum, lesson) => sum + lesson.stats.images, 0),
    },
  };
}

// ─── 7. Orchestration ──────────────────────────────────────────────────────────

async function listHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) return listHtmlFiles(full);
      return entry.isFile() && full.endsWith('.html') ? [full] : [];
    }),
  );
  return nested.flat().sort();
}

async function loadMedia() {
  try {
    return JSON.parse(await readFile(MEDIA_MANIFEST, 'utf-8')).images ?? {};
  } catch {
    console.warn('⚠  Miroir d\'images absent : les blocs image n\'auront pas de fichier local.');
    console.warn('   Lancer : node scripts/mirror-lecons-images.mjs\n');
    return {};
  }
}

async function main() {
  const media = await loadMedia();
  const files = await listHtmlFiles(LECONS_DIR);
  console.log(`Parsing de ${files.length} leçons…`);

  const lessons = [];
  const warnings = [];

  for (const file of files) {
    const lesson = parseLesson(file, await readFile(file, 'utf-8'), media);
    if (lesson.stats.blocks === 0) warnings.push(`aucun bloc extrait : ${lesson.sourceFile}`);
    const orphans = countOrphanImages(lesson.blocks);
    if (orphans > 0) warnings.push(`${orphans} image(s) hors miroir : ${lesson.sourceFile}`);
    lessons.push(lesson);
  }

  const index = buildIndex(lessons);
  report(lessons, index, warnings);

  if (STATS_ONLY) {
    console.log('\n--stats : rien écrit.');
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(join(OUT_DIR, 'corpus.json'), `${JSON.stringify({ generatedAt: index.generatedAt, lessons }, null, 2)}\n`);
  await writeFile(join(OUT_DIR, 'index.json'), `${JSON.stringify(index, null, 2)}\n`);
  console.log(`\nÉcrit : ${relative(ROOT, OUT_DIR)}/corpus.json + index.json`);
}

function countOrphanImages(blocks) {
  let count = 0;
  for (const block of blocks) {
    for (const image of block.images ?? []) if (!image.file) count++;
    if (block.children) count += countOrphanImages(block.children);
  }
  return count;
}

function report(lessons, index, warnings) {
  const { stats } = index;
  console.log(`\n  ${stats.lessons} leçons · ${stats.blocks} blocs · ${stats.words.toLocaleString('fr-FR')} mots · ${stats.images} images`);

  const roles = {};
  for (const lesson of lessons) {
    for (const [role, count] of Object.entries(lesson.stats.byRole)) roles[role] = (roles[role] ?? 0) + count;
  }
  console.log('\n  Blocs par rôle :');
  for (const [role, count] of Object.entries(roles).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${String(count).padStart(5)}  ${role}`);
  }

  console.log('\n  Matières :');
  for (const subject of index.subjects) {
    const perLevel = LEVEL_ORDER.filter((l) => subject.byLevel[l]).map((l) => `${l} ${subject.byLevel[l]}`).join(' · ');
    console.log(`    ${String(subject.lessons).padStart(4)}  ${subject.slug.padEnd(22)} ${perLevel}`);
  }

  console.log(`\n  ${stats.notions} notions distinctes, dont ${stats.spiralNotions} spiralaires (≥ 2 niveaux) :`);
  for (const notion of index.notions.filter((n) => n.levelCount >= 3).slice(0, 8)) {
    console.log(`    ${notion.levelCount} niveaux  ${LEVEL_ORDER.filter((l) => notion.levels[l]).join('·')}  ${notion.title}`);
  }

  if (warnings.length > 0) {
    console.log(`\n⚠  ${warnings.length} avertissement(s) :`);
    for (const warning of warnings.slice(0, 10)) console.log(`    ${warning}`);
    if (warnings.length > 10) console.log(`    … et ${warnings.length - 10} autres`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
