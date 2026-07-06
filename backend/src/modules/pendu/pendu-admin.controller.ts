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
import { PenduService } from './pendu.service';
import { CreatePenduWordDto, UpdatePenduWordDto } from './dto/pendu.dto';

@Controller('pendu')
@UseGuards(JwtAuthGuard)
export class PenduAdminController {
  constructor(private readonly penduService: PenduService) {}

  @Get('words')
  findWords(@Query('search') search?: string) {
    return this.penduService.findWords(search);
  }

  @Post('words')
  createWord(@Body() dto: CreatePenduWordDto) {
    return this.penduService.createWord(dto);
  }

  @Patch('words/:id')
  updateWord(@Param('id') id: string, @Body() dto: UpdatePenduWordDto) {
    return this.penduService.updateWord(id, dto);
  }

  @Delete('words/:id')
  deleteWord(@Param('id') id: string) {
    return this.penduService.deleteWord(id);
  }

  @Get('progression')
  getProgression() {
    return this.penduService.getProgression();
  }

  @Delete('progression')
  resetProgression() {
    return this.penduService.resetProgression();
  }
}