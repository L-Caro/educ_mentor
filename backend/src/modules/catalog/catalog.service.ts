import { Injectable, OnModuleInit, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppModule } from './entities/module.entity';
import { MODULES_CONFIG } from './modules.config';

@Injectable()
export class CatalogService implements OnModuleInit {
  constructor(
    @InjectRepository(AppModule)
    private readonly repo: Repository<AppModule>,
  ) {}

  async onModuleInit() {
    for (const mod of MODULES_CONFIG) {
      const exists = await this.repo.findOneBy({ id: mod.id });
      if (!exists) {
        await this.repo.save(mod);
      }
    }
  }

  findAll(onlyActive?: boolean): Promise<AppModule[]> {
    const where = onlyActive ? { is_active: true } : {};
    return this.repo.find({ where, order: { display_order: 'ASC' } });
  }

  async update(
    id: string,
    data: { is_active?: boolean; display_order?: number },
  ): Promise<AppModule> {
    const mod = await this.repo.findOneBy({ id });
    if (!mod) throw new NotFoundException(`Module "${id}" introuvable`);
    Object.assign(mod, data);
    return this.repo.save(mod);
  }
}
