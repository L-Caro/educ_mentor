import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TablesService } from './tables.service';
import {
  StartTablesSessionDto,
  RecordTablesAnswerDto,
  CompleteTablesSessionDto,
} from './dto/tables.dto';

@Controller('tables')
export class TablesGameController {
  constructor(private readonly tablesService: TablesService) {}

  @Get('status')
  getTableStatus() {
    return this.tablesService.getTableStatus();
  }

  @Get('session')
  startSession(@Query() dto: StartTablesSessionDto) {
    return this.tablesService.startSession(dto);
  }

  @Post('session/:id/answer')
  recordAnswer(@Param('id') id: string, @Body() dto: RecordTablesAnswerDto) {
    return this.tablesService.recordAnswer(id, dto);
  }

  @Post('session/:id/complete')
  completeSession(@Param('id') id: string, @Body() dto: CompleteTablesSessionDto) {
    return this.tablesService.completeSession(id, dto.correct_answers, dto.total_questions);
  }
}
