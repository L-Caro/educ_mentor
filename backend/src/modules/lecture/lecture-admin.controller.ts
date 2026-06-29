import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Put, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LectureService } from './lecture.service';
import { CreateQuestionDto, CreateTextDto, UpdateQuestionDto, UpdateTextDto } from './dto/lecture.dto';

@Controller('admin/lecture')
@UseGuards(JwtAuthGuard)
export class LectureAdminController {
  constructor(private readonly service: LectureService) {}

  // ── Textes ──────────────────────────────────────────────────────────────────

  @Get('texts')
  getAllTexts() {
    return this.service.getAllTexts();
  }

  @Post('texts')
  createText(@Body() dto: CreateTextDto) {
    return this.service.createText(dto);
  }

  @Put('texts/:id')
  updateText(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTextDto) {
    return this.service.updateText(id, dto);
  }

  @Delete('texts/:id')
  deleteText(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteText(id);
  }

  // ── Questions ───────────────────────────────────────────────────────────────

  @Get('texts/:textId/questions')
  getQuestions(@Param('textId', ParseIntPipe) textId: number) {
    return this.service.getQuestionsForText(textId);
  }

  @Post('texts/:textId/questions')
  createQuestion(@Param('textId', ParseIntPipe) textId: number, @Body() dto: CreateQuestionDto) {
    return this.service.createQuestion(textId, dto);
  }

  @Put('questions/:id')
  updateQuestion(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateQuestionDto) {
    return this.service.updateQuestion(id, dto);
  }

  @Delete('questions/:id')
  deleteQuestion(@Param('id', ParseIntPipe) id: number) {
    return this.service.deleteQuestion(id);
  }

  // ── Progression ─────────────────────────────────────────────────────────────

  @Get('progression')
  getProgression() {
    return this.service.getProgression();
  }

  @Delete('progression')
  resetProgression() {
    return this.service.resetProgression();
  }
}