import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MemorySession } from './entities/memory-session.entity';
import { MemoryCard } from './entities/memory-card.entity';
import { MemoryService } from './memory.service';
import { MemoryCardSeedService } from './memory-card.seed';
import { MemoryGameController } from './memory-game.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([MemorySession, MemoryCard]), AuthModule],
  providers: [MemoryService, MemoryCardSeedService],
  controllers: [MemoryGameController],
})
export class MemoryModule {}
