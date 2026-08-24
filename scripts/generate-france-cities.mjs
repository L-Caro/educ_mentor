/**
 * Génère frontend/src/modules/france/data/france_cities.json
 *
 * Approche :
 * - Parse les paths SVG des 96 depts métro → calcule leur centroïde en espace SVG
 * - Utilise la préfecture de chaque dept comme point de référence lat/lon
 * - Ajustement affine (moindres carrés) sur les 96 paires → transform (lat,lon) → (svgX,svgY)
 * - Applique la transform à toutes les plus_grandes_villes des depts métro
 * - Calcule kmsPerSvgUnit via haversine(Paris, Brest) / distance SVG
 */

import { createRequire } from 'module';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

const require = createRequire(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');

const france  = require(join(ROOT, 'frontend/node_modules/@svg-maps/france.departments'));
const geoData = require(join(ROOT, 'backend/src/modules/france/data/france_geo.json'));

const locations = france.default?.locations ?? france.locations;
const depts     = geoData.departements;
const DOM_TOM   = new Set(['971', '972', '973', '974', '976']);

// ─── 1. Parser les paths SVG → centroïdes ──────────────────────────────────

function parseSvgPath(d) {
  const points = [];
  const tokens = d.match(/[mzMZ]|[-+]?(?:\d*\.)?\d+(?:[eE][+-]?\d+)?/g) ?? [];
  let i = 0, cx = 0, cy = 0, subStartX = 0, subStartY = 0;

  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'z' || cmd === 'Z') {
      cx = subStartX; cy = subStartY;
      continue;
    }
    // cmd === 'm' ou 'M' : premier moveto, puis lineto implicites
    const isRel = cmd === 'm';
    let first = true;
    while (i < tokens.length && !/[mzMZ]/.test(tokens[i])) {
      const x = parseFloat(tokens[i++]);
      const y = parseFloat(tokens[i++]);
      if (isRel) { cx += x; cy += y; } else { cx = x; cy = y; }
      if (first) { subStartX = cx; subStartY = cy; first = false; }
      points.push([cx, cy]);
    }
  }
  return points;
}

function centroid(pts) {
  const n = pts.length;
  return { x: pts.reduce((s, p) => s + p[0], 0) / n, y: pts.reduce((s, p) => s + p[1], 0) / n };
}

// ─── 2. Points de calibrage : centroïde SVG ↔ préfecture lat/lon ───────────

const calibPts = [];
for (const loc of locations) {
  if (DOM_TOM.has(loc.id)) continue;
  const dept = depts[loc.id];
  if (!dept) continue;
  const { lat, lng: lon } = dept.prefecture.coordonnees;
  if (lat == null || lon == null) continue;
  const { x: svgX, y: svgY } = centroid(parseSvgPath(loc.path));
  calibPts.push({ lat, lon, svgX, svgY });
}

console.log(`Points de calibrage : ${calibPts.length} depts`);

// ─── 3. Ajustement affine par moindres carrés ───────────────────────────────
// svgX = ax·lon + bx·lat + cx
// svgY = ay·lon + by·lat + cy

function solve3x3(A, b) {
  const aug = A.map((row, i) => [...row, b[i]]);
  for (let col = 0; col < 3; col++) {
    let maxR = col;
    for (let r = col + 1; r < 3; r++) if (Math.abs(aug[r][col]) > Math.abs(aug[maxR][col])) maxR = r;
    [aug[col], aug[maxR]] = [aug[maxR], aug[col]];
    for (let r = col + 1; r < 3; r++) {
      const f = aug[r][col] / aug[col][col];
      for (let k = col; k <= 3; k++) aug[r][k] -= f * aug[col][k];
    }
  }
  const x = [0, 0, 0];
  for (let i = 2; i >= 0; i--) {
    x[i] = aug[i][3];
    for (let j = i + 1; j < 3; j++) x[i] -= aug[i][j] * x[j];
    x[i] /= aug[i][i];
  }
  return x;
}

function fitAffine(pts) {
  const n = pts.length;
  let S_ll=0, S_la=0, S_l=0, S_aa=0, S_a=0;
  let Bx_l=0, Bx_a=0, Bx=0, By_l=0, By_a=0, By=0;
  for (const { lon: l, lat: a, svgX: x, svgY: y } of pts) {
    S_ll += l*l; S_la += l*a; S_l += l;
    S_aa += a*a; S_a += a;
    Bx_l += l*x; Bx_a += a*x; Bx += x;
    By_l += l*y; By_a += a*y; By += y;
  }
  const M = [[S_ll, S_la, S_l], [S_la, S_aa, S_a], [S_l, S_a, n]];
  const [ax, bx, cx] = solve3x3(M, [Bx_l, Bx_a, Bx]);
  const [ay, by, cy] = solve3x3(M, [By_l, By_a, By]);
  return { ax, bx, cx, ay, by, cy };
}

const T = fitAffine(calibPts);
console.log('Transform:', T);

function toSvg(lat, lon) {
  return {
    svgX: T.ax * lon + T.bx * lat + T.cx,
    svgY: T.ay * lon + T.by * lat + T.cy,
  };
}

// Erreur résiduelle sur les points de calibrage
const residuals = calibPts.map(p => {
  const { svgX, svgY } = toSvg(p.lat, p.lon);
  return Math.sqrt((svgX - p.svgX) ** 2 + (svgY - p.svgY) ** 2);
});
const maxResidual = Math.max(...residuals);
const avgResidual = residuals.reduce((s, r) => s + r, 0) / residuals.length;
console.log(`Résiduel max : ${maxResidual.toFixed(2)}px, moyen : ${avgResidual.toFixed(2)}px`);

// ─── 4. kmsPerSvgUnit (Paris → Brest) ──────────────────────────────────────

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180) * Math.cos(lat2*Math.PI/180) * Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

const PARIS  = { lat: 48.8566, lon: 2.3522 };
const BREST  = { lat: 48.3905, lon: -4.4860 };
const realKm = haversine(PARIS.lat, PARIS.lon, BREST.lat, BREST.lon);
const pSvg   = toSvg(PARIS.lat, PARIS.lon);
const bSvg   = toSvg(BREST.lat, BREST.lon);
const svgDist = Math.sqrt((pSvg.svgX - bSvg.svgX)**2 + (pSvg.svgY - bSvg.svgY)**2);
const kmsPerSvgUnit = realKm / svgDist;
console.log(`kmsPerSvgUnit : ${kmsPerSvgUnit.toFixed(4)} (Paris→Brest ${realKm.toFixed(0)}km, SVG dist ${svgDist.toFixed(1)}px)`);

// ─── 5. Sélection curatoriale ───────────────────────────────────────────────
// Rangs retenus par département — critère : notoriété nationale, pas juste taille.
// Grandes métropoles : top 3-5 si toutes connues.
// Depts moyens : top 1-2.
// Petits depts ruraux : rang 1 seulement.
// Rangs non-consécutifs autorisés (ex. 37→[1,5] = Tours + Amboise, skip suburbs).

const CURATED = {
  '01': [1, 5],          // Bourg-en-Bresse, Gex
  '02': [1, 2, 3],       // Saint-Quentin, Soissons, Laon
  '03': [1, 2, 3],       // Vichy, Montluçon, Moulins
  '04': [1, 2],          // Manosque, Digne-les-Bains
  '05': [1, 2],          // Gap, Briançon
  '06': [1, 2, 3, 5],    // Nice, Antibes, Cannes, Grasse
  '07': [1, 2],          // Annonay, Aubenas
  '08': [1, 2],          // Charleville-Mézières, Sedan
  '09': [1, 2],          // Pamiers, Foix
  '10': [1],             // Troyes
  '11': [1, 2],          // Narbonne, Carcassonne
  '12': [1, 2],          // Rodez, Millau (viaduc)
  '13': [1, 2, 3],       // Marseille, Aix-en-Provence, Arles
  '14': [1, 3, 4],       // Caen, Lisieux, Bayeux (D-Day, tapisserie)
  '15': [1],             // Aurillac
  '16': [1, 2],          // Angoulême, Cognac
  '17': [1, 2, 3, 4],    // La Rochelle, Saintes, Rochefort, Royan
  '18': [1],             // Bourges
  '19': [1, 2],          // Brive-la-Gaillarde, Tulle
  '21': [1, 2],          // Dijon, Beaune
  '22': [1, 2, 3],       // Saint-Brieuc, Lannion, Dinan
  '23': [1],             // Guéret
  '24': [1, 2, 3],       // Périgueux, Bergerac, Sarlat-la-Canéda
  '25': [1, 2, 3],       // Besançon, Montbéliard, Pontarlier
  '26': [1, 2, 3],       // Valence, Romans-sur-Isère, Montélimar
  '27': [1, 2],          // Évreux, Vernon (jardins Monet)
  '28': [1, 2],          // Chartres, Dreux
  '29': [1, 2, 4],       // Brest, Quimper, Concarneau
  '2A': [1, 2, 5],       // Ajaccio, Porto-Vecchio, Bonifacio
  '2B': [1, 2, 3],       // Bastia, Corte, Calvi
  '30': [1, 2],          // Nîmes, Alès
  '31': [1, 4],          // Toulouse, Blagnac (Airbus/aéroport)
  '32': [1],             // Auch
  '33': [1, 5],          // Bordeaux, Libourne (Saint-Émilion area)
  '34': [1, 2, 3],       // Montpellier, Béziers, Sète
  '35': [1, 2, 3],       // Rennes, Saint-Malo, Fougères
  '36': [1],             // Châteauroux
  '37': [1, 5],          // Tours, Amboise (château, skip suburbs)
  '38': [1, 2],          // Grenoble, Vienne (jazz, romain)
  '39': [1, 2],          // Lons-le-Saunier, Dole (Pasteur)
  '40': [1, 2],          // Dax, Mont-de-Marsan
  '41': [1, 2],          // Blois, Vendôme
  '42': [1, 2],          // Saint-Étienne, Roanne
  '43': [1],             // Le Puy-en-Velay
  '44': [1, 2],          // Nantes, Saint-Nazaire
  '45': [1, 5],          // Orléans, Montargis (skip suburbs)
  '46': [1, 2],          // Cahors, Figeac (Champollion)
  '47': [1, 2],          // Agen, Villeneuve-sur-Lot
  '48': [1],             // Mende
  '49': [1, 2, 3],       // Angers, Cholet, Saumur
  '50': [1, 2],          // Cherbourg-en-Cotentin, Saint-Lô
  '51': [1, 2, 3],       // Reims, Châlons-en-Champagne, Épernay
  '52': [1, 2, 3],       // Saint-Dizier, Chaumont, Langres (Diderot)
  '53': [1],             // Laval
  '54': [1, 5],          // Nancy (Stanislas), Lunéville (skip suburbs)
  '55': [1, 2],          // Verdun, Bar-le-Duc
  '56': [1, 2],          // Lorient, Vannes
  '57': [1, 2, 5],       // Metz, Thionville, Sarreguemines
  '58': [1],             // Nevers
  '59': [1, 2, 3, 4, 5], // Lille, Roubaix, Tourcoing, Valenciennes, Dunkerque
  '60': [1, 2, 4],       // Compiègne, Beauvais, Senlis
  '61': [1],             // Alençon (dentelles)
  '62': [1, 2, 3, 4],    // Calais, Boulogne-sur-Mer, Lens, Arras
  '63': [1, 2, 4],       // Clermont-Ferrand, Riom, Thiers (coutellerie)
  '64': [1, 2, 3, 5],    // Pau, Bayonne, Biarritz, Hendaye
  '65': [1, 2],          // Tarbes, Lourdes
  '66': [1, 2, 5],       // Perpignan, Canet-en-Roussillon, Argelès-sur-Mer
  '67': [1, 2, 5],       // Strasbourg, Haguenau, Sélestat (marché Noël)
  '68': [1, 2],          // Mulhouse, Colmar
  '69': [1],             // Lyon (banlieues moins utiles en placement)
  '70': [1],             // Vesoul (festival cinéma)
  '71': [1, 2, 3],       // Chalon-sur-Saône, Mâcon, Le Creusot
  '72': [1],             // Le Mans (24h)
  '73': [1, 2, 3],       // Chambéry, Aix-les-Bains, Albertville (JO 1992)
  '74': [1, 2, 3, 4],    // Annecy, Thonon-les-Bains, Annemasse, Cluses
  '75': [1],             // Paris
  '76': [1, 2, 3],       // Le Havre, Rouen, Dieppe
  '77': [1, 5],          // Meaux (Brie), Melun
  '78': [1, 3, 5],       // Versailles, Mantes-la-Jolie, Rambouillet
  '79': [1],             // Niort
  '80': [1, 2],          // Amiens, Abbeville
  '81': [1, 2],          // Albi (Toulouse-Lautrec), Castres
  '82': [1, 3],          // Montauban (Ingres), Moissac (abbaye)
  '83': [1, 2, 3],       // Toulon, Fréjus, Hyères
  '84': [1, 2, 4],       // Avignon, Orange (théâtre romain), Carpentras
  '85': [1, 2],          // La Roche-sur-Yon, Les Sables-d'Olonne
  '86': [1, 2],          // Poitiers, Châtellerault
  '87': [1],             // Limoges (porcelaine)
  '88': [1, 4],          // Épinal (images), Gérardmer
  '89': [1, 2],          // Auxerre, Sens
  '90': [1],             // Belfort (Lion)
  '91': [1, 2],          // Évry-Courcouronnes, Corbeil-Essonnes
  '92': [1, 2, 4],       // Boulogne-Billancourt, Nanterre, Rueil-Malmaison
  '93': [1, 2],          // Saint-Denis (Stade de France), Montreuil
  '94': [1],             // Créteil
  '95': [1, 2],          // Cergy, Argenteuil (Monet)
};

// ─── 6. Extraire les villes ─────────────────────────────────────────────────

const cities = [];
const seenKeys = new Set();

for (const [deptCode, dept] of Object.entries(depts)) {
  if (DOM_TOM.has(deptCode)) continue;
  if (!dept.plus_grandes_villes) continue;

  const allowedRanks = new Set(CURATED[deptCode] ?? [1]);

  for (const ville of dept.plus_grandes_villes.filter(v => allowedRanks.has(v.rang))) {
    const key = `${ville.nom}|${deptCode}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    const { lat, lng: lon } = ville.coordonnees;
    if (lat == null || lon == null) continue;

    const { svgX, svgY } = toSvg(lat, lon);
    cities.push({
      nom:  ville.nom,
      dept: deptCode,
      svgX: Math.round(svgX * 10) / 10,
      svgY: Math.round(svgY * 10) / 10,
    });
  }
}

console.log(`Villes générées : ${cities.length}`);

// ─── 7. Écriture ────────────────────────────────────────────────────────────

// Frontend : coords SVG pour affichage des marqueurs
const outFront = { kmsPerSvgUnit: Math.round(kmsPerSvgUnit * 10000) / 10000, cities };
const frontPath = join(ROOT, 'frontend/src/modules/france/data/france_cities.json');
writeFileSync(frontPath, JSON.stringify(outFront, null, 2));
console.log(`✓ ${frontPath}`);

// Backend : liste de sélection (nom + dept) pour la génération des questions
const backList = cities.map(({ nom, dept }) => ({ nom, dept }));
const backPath = join(ROOT, 'backend/src/modules/france/data/france_cities_list.json');
writeFileSync(backPath, JSON.stringify(backList, null, 2));
console.log(`✓ ${backPath}`);
