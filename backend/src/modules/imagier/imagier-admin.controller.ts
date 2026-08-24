import {
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
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { Response } from 'express';
import { ImagierService } from './imagier.service';
import { ImagierImportService } from './imagier-import.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateWordDto, UpdateWordDto, ImportJsonDto } from './dto/imagier.dto';

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
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, _file, cb) => {
          // La destination sera déterminée dynamiquement dans le handler
          // On utilise un dossier temp, on déplacera ensuite
          const tmpDir = path.resolve('./data/images/imagier/_tmp');
          fs.mkdirSync(tmpDir, { recursive: true });
          cb(null, tmpDir);
        },
        filename: (_req, file, cb) => {
          cb(null, file.originalname);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, allowed.includes(ext));
      },
    }),
  )
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Res() res: Response,
  ) {
    const word = await this.imagierService.getWordById(id);
    if (!word) {
      return res.status(404).json({ error: 'Mot introuvable' });
    }

    // Déplacer depuis _tmp vers le bon dossier catégorie
    const basePath = this.imagierService.getImagesBasePath();
    const categoryDir = path.join(basePath, word.category);
    fs.mkdirSync(categoryDir, { recursive: true });

    const destPath = path.join(categoryDir, file.originalname);
    fs.renameSync(file.path, destPath);

    const updated = await this.imagierService.saveUploadedImage(
      id,
      file.originalname,
    );
    return res.json(updated);
  }
}
