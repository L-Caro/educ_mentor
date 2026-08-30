import { access, mkdir } from 'node:fs/promises';
import sharp from 'sharp';
import { fetchBinary } from './lib/http.ts';

async function exists(fileUrl: URL): Promise<boolean> {
  try {
    await access(fileUrl);
    return true;
  } catch {
    return false;
  }
}

/** Part du bas retirée pour effacer le mot rouge incrusté (validé sur échantillon). */
const CROP_RATIO = 0.18;
const MAX_WIDTH = 640;
const WEBP_QUALITY = 80;

export interface ImageOutcome {
  status: 'ok' | 'cached' | 'not-found' | 'error';
  file: string | null;
  message?: string;
}

/** Télécharge l'image, rogne le bandeau du mot, redimensionne, écrit en webp.
 * Si le fichier cible existe déjà, ne retélécharge pas (re-run bon marché). */
export async function downloadCropped(
  imageUrl: string,
  destDir: URL,
  basename: string,
): Promise<ImageOutcome> {
  const relativeFile = `${basename}.webp`;
  if (await exists(new URL(relativeFile, destDir))) {
    return { status: 'cached', file: relativeFile };
  }

  let result;
  try {
    result = await fetchBinary(imageUrl);
  } catch (error) {
    return { status: 'error', file: null, message: (error as Error).message };
  }

  if (result.status === 404) return { status: 'not-found', file: null };
  if (!result.ok || !result.bytes) {
    return { status: 'error', file: null, message: `HTTP ${result.status}` };
  }

  try {
    const source = sharp(result.bytes);
    const { width = 0, height = 0 } = await source.metadata();
    if (!width || !height) return { status: 'error', file: null, message: 'métadonnées image manquantes' };

    const keptHeight = Math.round(height * (1 - CROP_RATIO));
    await mkdir(destDir, { recursive: true });

    await sharp(result.bytes)
      .extract({ left: 0, top: 0, width, height: keptHeight })
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toFile(new URL(relativeFile, destDir).pathname);

    return { status: 'ok', file: relativeFile };
  } catch (error) {
    return { status: 'error', file: null, message: (error as Error).message };
  }
}
