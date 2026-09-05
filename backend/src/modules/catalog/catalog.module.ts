import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppModule as ModuleEntity } from './entities/module.entity';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([ModuleEntity]), AuthModule],
  providers: [CatalogService],
  // Exporté pour le péage des jeux, qui emprunte les questions de ce module sans rien
  // enregistrer : voir `PeageService`.
  exports: [CatalogService],
  controllers: [CatalogController],
})
export class CatalogModule {}
