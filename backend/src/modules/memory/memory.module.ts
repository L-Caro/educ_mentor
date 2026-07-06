import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemorySession } from './entities/memory-session.entity';
import { MemoryService } from './memory.service';
import { MemoryGameController } from './memory-game.controller';
import { ImagierModule } from '../imagier/imagier.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([MemorySession]),
    ImagierModule,
    AuthModule,
  ],
  providers: [MemoryService],
  controllers: [MemoryGameController],
})
export class MemoryModule {}