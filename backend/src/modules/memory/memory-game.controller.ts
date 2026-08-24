import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MemoryService } from './memory.service';
import {
  StartMemorySessionDto,
  CompleteMemorySessionDto,
} from './dto/memory.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('memory')
export class MemoryGameController {
  constructor(private readonly memoryService: MemoryService) {}

  @Post('session')
  startSession(@Body() dto: StartMemorySessionDto) {
    return this.memoryService.startSession(dto);
  }

  @Post('session/:id/complete')
  completeSession(
    @Param('id') id: string,
    @Body() dto: CompleteMemorySessionDto,
  ) {
    return this.memoryService.completeSession(id, dto.attempts);
  }

  @Get('progression')
  @UseGuards(JwtAuthGuard)
  getProgression() {
    return this.memoryService.getProgression();
  }

  @Delete('progression')
  @UseGuards(JwtAuthGuard)
  resetProgression() {
    return this.memoryService.resetProgression();
  }
}
