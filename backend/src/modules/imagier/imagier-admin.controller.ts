import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { randomUUID } from 'node:crypto';
import * as path from 'path';
import * as fsp from 'node:fs/promises';
import { Response } from 'express';
import { ImagierService } from './imagier.service';
import { ImagierImportService } from './imagier-import.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateWordDto, UpdateWordDto, ImportJsonDto } from './dto/imagier.dto';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Type MIME accepté → extension utilisée sur le disque. La liste fait autorité :
 * l'extension du nom envoyé par le client n'est jamais lue. */
const ALLOWED_IMAGE_TYPES = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
]);

@Controller('imagier')
@UseGuards(JwtAuthGuard)
export class ImagierAdminController {
  constructor(
    private readonly imagierService: ImagierService,
    private readonly importService: ImagierImportService,
  ) {}

  // ─── Mots ──────────────────────────────────────────────────────────────────

  @Get('words')
  findWords(
    @Query('category') category?: string,
    @Query('is_active') isActive?: string,
    @Query('search') search?: string,
  ) {
    return this.imagierService.findWords({
      category,
      is_active: isActive !== undefined ? isActive === 'true' : undefined,
      search,
    });
  }

  @Post('words')
  createWord(@Body() dto: CreateWordDto) {
    return this.imagierService.createWord(dto);
  }

  @Patch('words/:id')
  updateWord(@Param('id') id: string, @Body() dto: UpdateWordDto) {
    return this.imagierService.updateWord(id, dto);
  }

  @Delete('words/:id')
  deleteWord(@Param('id') id: string) {
    return this.imagierService.deleteWord(id);
  }

  // ─── Catégories ────────────────────────────────────────────────────────────
  // Note : la liste des catégories (GET) vit dans ImagierGameController, non protégée —
  // elle est consommée par le pré-jeu Imagier ET Memory, pas seulement par l'admin.

  @Patch('normalize-categories')
  normalizeCategories() {
    return this.imagierService.normalizeCategories();
  }

  // ─── Import ────────────────────────────────────────────────────────────────

  @Post('import')
  async importJson(@Body() dto: ImportJsonDto) {
    return this.importService.importFromJson(dto.json, dto.overwrite ?? false);
  }

  // ─── Progression ───────────────────────────────────────────────────────────

  @Get('progression')
  getProgression() {
    return this.imagierService.getProgression();
  }

  @Delete('progression')
  resetProgression() {
    return this.imagierService.resetProgression();
  }

  // ─── Upload image ──────────────────────────────────────────────────────────

  @Post('words/:id/image')
  @UseInterceptors(
    // `memoryStorage` plutôt que `diskStorage` : le fichier n'atteint le disque qu'après
    // validation, sous un nom choisi par le serveur, dans un dossier dérivé de la config.
    // L'ancienne version écrivait `file.originalname` tel quel dans un dossier temporaire
    // en dur — un nom du type `../../evil.png` sortait de l'arborescence prévue.
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
      fileFilter: (_req, file, cb) => {
        cb(null, ALLOWED_IMAGE_TYPES.has(file.mimetype));
      },
    }),
  )
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    // `fileFilter` refuse en silence : sans cette garde, le handler plantait en 500 sur un
    // `file` indéfini au lieu de renvoyer un 400 explicite.
    if (!file) {
      throw new BadRequestException(
        `Fichier manquant ou type non accepté (attendus : ${[...ALLOWED_IMAGE_TYPES].join(', ')}).`,
      );
    }

    const word = await this.imagierService.getWordById(id);
    if (!word) {
      return res.status(404).json({ error: 'Mot introuvable' });
    }

    // Nom généré côté serveur : rien de ce que le client envoie n'atteint le système de
    // fichiers. L'extension vient du type MIME validé, pas du nom d'origine.
    const filename = `${randomUUID()}${ALLOWED_IMAGE_TYPES.get(file.mimetype)!}`;

    const basePath = path.resolve(this.imagierService.getImagesBasePath());
    const categoryDir = path.resolve(basePath, word.category);

    // Défense en profondeur : la catégorie vient de la base, où elle est normalisée, mais
    // une donnée corrompue ne doit pas pouvoir faire écrire hors du dossier d'images.
    if (
      categoryDir !== basePath &&
      !categoryDir.startsWith(basePath + path.sep)
    ) {
      throw new BadRequestException('Catégorie invalide.');
    }

    await fsp.mkdir(categoryDir, { recursive: true });
    await fsp.writeFile(path.join(categoryDir, filename), file.buffer);

    const updated = await this.imagierService.saveUploadedImage(id, filename);
    return res.json(updated);
  }
}
