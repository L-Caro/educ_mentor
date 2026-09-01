import { randomUUID } from 'node:crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DicteeItem } from './entities/dictee-item.entity';
import type {
  CreateDicteeItemDto,
  UpdateDicteeItemDto,
} from './dto/dictee.dto';

@Injectable()
export class DicteeService {
  constructor(
    @InjectRepository(DicteeItem)
    private readonly itemRepo: Repository<DicteeItem>,
  ) {}

  // ─── Admin — items ─────────────────────────────────────────────────────────

  findItems(filters: {
    niveau?: string;
    is_active?: boolean;
  }): Promise<DicteeItem[]> {
    const where: Record<string, unknown> = {};
    if (filters.niveau) where.niveau = filters.niveau;
    if (filters.is_active !== undefined) where.is_active = filters.is_active;
    return this.itemRepo.find({ where, order: { created_at: 'DESC' } });
  }

  createItem(dto: CreateDicteeItemDto): Promise<DicteeItem> {
    return this.itemRepo.save(
      this.itemRepo.create({
        id: randomUUID(),
        niveau: dto.niveau,
        contenu: dto.contenu.trim(),
        notions: dto.notions ?? [],
        is_active: dto.is_active ?? false,
      }),
    );
  }

  async updateItem(id: string, dto: UpdateDicteeItemDto): Promise<DicteeItem> {
    const item = await this.itemRepo.findOneBy({ id });
    if (!item) throw new NotFoundException(`Item "${id}" introuvable`);
    if (dto.niveau !== undefined) item.niveau = dto.niveau;
    if (dto.contenu !== undefined) item.contenu = dto.contenu.trim();
    if (dto.notions !== undefined) item.notions = dto.notions;
    if (dto.is_active !== undefined) item.is_active = dto.is_active;
    return this.itemRepo.save(item);
  }

  async deleteItem(id: string): Promise<void> {
    await this.itemRepo.delete(id);
  }
}
