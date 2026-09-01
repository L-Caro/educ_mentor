import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DicteeService } from './dictee.service';
import { DicteeImportService } from './dictee-import.service';
import {
  CreateDicteeItemDto,
  ImportDicteeDto,
  UpdateDicteeItemDto,
} from './dto/dictee.dto';

@Controller('dictee')
@UseGuards(JwtAuthGuard)
export class DicteeAdminController {
  constructor(
    private readonly service: DicteeService,
    private readonly importService: DicteeImportService,
  ) {}

  // ─── Items ────────────────────────────────────────────────────────────────

  @Get('items')
  findItems(
    @Query('niveau') niveau?: string,
    @Query('is_active') isActive?: string,
  ) {
    return this.service.findItems({
      niveau,
      is_active: isActive === undefined ? undefined : isActive === 'true',
    });
  }

  @Post('items')
  createItem(@Body() dto: CreateDicteeItemDto) {
    return this.service.createItem(dto);
  }

  @Patch('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: UpdateDicteeItemDto) {
    return this.service.updateItem(id, dto);
  }

  @Delete('items/:id')
  deleteItem(@Param('id') id: string) {
    return this.service.deleteItem(id);
  }

  // ─── Import ───────────────────────────────────────────────────────────────

  @Post('import')
  importJson(@Body() dto: ImportDicteeDto) {
    return this.importService.importFromJson(dto.json, {
      replace: dto.replace,
      activate: dto.activate,
    });
  }

  // ─── Progression ──────────────────────────────────────────────────────────

  @Get('progression')
  getProgression() {
    return this.service.getProgression();
  }

  @Get('mots-difficiles')
  getWordErrors() {
    return this.service.getWordErrors();
  }

  @Delete('progression')
  resetProgression() {
    return this.service.resetProgression();
  }
}
