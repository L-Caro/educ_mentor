import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DicteeItem } from './entities/dictee-item.entity';
import { DicteeSession } from './entities/dictee-session.entity';
import { DicteeService } from './dictee.service';
import { DicteeImportService } from './dictee-import.service';
import { DicteeAdminController } from './dictee-admin.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([DicteeItem, DicteeSession]), AuthModule],
  providers: [DicteeService, DicteeImportService],
  controllers: [DicteeAdminController],
})
export class DicteeModule {}
