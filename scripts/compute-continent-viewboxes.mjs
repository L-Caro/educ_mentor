import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const worldModule = require(path.join(__dirname, '../frontend/node_modules/@svg-maps/world/index.js'));
const world = worldModule.default ?? worldModule;

const pays = JSON.parse(readFileSync(
  path.join(__dirname, '../backend/src/modules/geo/data/pays.json'), 'utf-8'
));

// code ISO → continent (lowercase keys)
const codeToContinent = new Map(pays.pays.map(p => [p.code.toLowerCase(), p.continent]));


// Parse SVG path with only `m` (relative) and `z` commands
// Returns list of all absolute points
function parsePathPoints(d) {
  const points = [];
  let cx = 0, cy = 0;
  let subpathStartX = 0, subpathStartY = 0;
  let firstMove = true;

  // Tokenize: split on whitespace and commas, keep numbers (including scientific notation)
  const tokens = d.trim().split(/[\s,]+/).filter(Boolean);
  let i = 0;

  while (i < tokens.length) {
    const t = tokens[i];

    if (t === 'm') {
      i++;
      // First pair after 'm': relative move
      const dx = parseFloat(tokens[i++]);
      const dy = parseFloat(tokens[i++]);
      if (firstMove) {
        // First 'm' in path: treated as relative to (0,0)
        cx = dx; cy = dy;
        firstMove = false;
      } else {
        cx += dx; cy += dy;
      }
      subpathStartX = cx; subpathStartY = cy;
      points.push([cx, cy]);
      // Subsequent pairs are implicit relative lineto
      while (i < tokens.length && !/^[mzMZ]$/.test(tokens[i])) {
        const ddx = parseFloat(tokens[i++]);
        const ddy = parseFloat(tokens[i++]);
        if (!isNaN(ddx) && !isNaN(ddy)) {
          cx += ddx; cy += ddy;
          points.push([cx, cy]);
        }
      }
    } else if (t === 'z' || t === 'Z') {
      cx = subpathStartX; cy = subpathStartY;
      i++;
    } else {
      // Unexpected token, skip
      i++;
    }
  }

  return points;
}

// Compute bounding box from points
function bounds(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return { minX, minY, maxX, maxY };
}

// Merge multiple bounding boxes
function mergeBounds(boxes) {
  return {
    minX: Math.min(...boxes.map(b => b.minX)),
    minY: Math.min(...boxes.map(b => b.minY)),
    maxX: Math.max(...boxes.map(b => b.maxX)),
    maxY: Math.max(...boxes.map(b => b.maxY)),
  };
}

// Fragments Pacifique ouest qui apparaissent sur le côté gauche du SVG
// mais dont les îles principales sont à l'est (exclus du calcul des bornes)
const EXCLUDE_FROM_BOUNDS = new Set(['pf']); // Polynésie française

// Compute bounds per continent + country code lists
const continentBounds = {};
const continentCodes = {}; // continent → [svg_id, ...] (lowercase)

for (const loc of world.locations) {
  const continent = codeToContinent.get(loc.id);
  if (!continent) continue;

  // Toujours ajouter aux codes du continent (pour les clics)
  if (!continentCodes[continent]) continentCodes[continent] = [];
  continentCodes[continent].push(loc.id);

  // Mais exclure des bornes si fragment problématique
  if (EXCLUDE_FROM_BOUNDS.has(loc.id)) continue;

  const points = parsePathPoints(loc.path);
  if (points.length === 0) continue;
  let b = bounds(points);

  // Pays qui enjambent la ligne de changement de date (ex: Kiribati) :
  // minX proche de 0 ET maxX proche de 1010 → ignorer le fragment ouest
  if (b.minX < 100 && b.maxX > 900) {
    const eastPoints = points.filter(([x]) => x > 500);
    if (eastPoints.length > 0) b = bounds(eastPoints);
  }

  if (!continentBounds[continent]) continentBounds[continent] = [];
  continentBounds[continent].push(b);
}

const PADDING = 20;
const viewboxes = {};

for (const [continent, boxes] of Object.entries(continentBounds)) {
  const { minX, minY, maxX, maxY } = mergeBounds(boxes);
  // Stocke les bornes brutes (avant padding) pour le translate
  const rawW = maxX - minX;
  const rawH = maxY - minY;
  // Padding horizontal plus généreux pour éviter les continents trop étroits
  const padX = Math.max(PADDING, rawW * 0.15);
  const padY = Math.max(PADDING, rawH * 0.10);
  const x = Math.max(0, Math.floor(minX - padX));
  const y = Math.max(0, Math.floor(minY - padY));
  const w = Math.ceil(rawW + padX * 2);
  const h = Math.ceil(rawH + padY * 2);
  viewboxes[continent] = `${x} ${y} ${w} ${h}`;
  console.log(`${continent}: ${viewboxes[continent]}`);
}

const outViewboxes = path.join(__dirname, '../frontend/src/modules/geo/data/continent_viewboxes.json');
writeFileSync(outViewboxes, JSON.stringify(viewboxes, null, 2));
console.log('\n✓', outViewboxes);

const outCodes = path.join(__dirname, '../frontend/src/modules/geo/data/continent_countries.json');
writeFileSync(outCodes, JSON.stringify(continentCodes, null, 2));
console.log('✓', outCodes);
