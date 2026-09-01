import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { DicteeService } from './dictee.service';
import {
  CompleteDicteeSessionDto,
  StartDicteeSessionDto,
} from './dto/dictee.dto';

/** Routes du jeu, non protégées : le frontend enfant les appelle sans jeton. */
@Controller('dictee')
export class DicteeGameController {
  constructor(private readonly service: DicteeService) {}

  @Get('notions')
  getNotions(@Query('niveau') niveau?: string) {
    return this.service.getNotions(niveau);
  }

  @Post('session')
  startSession(@Body() dto: StartDicteeSessionDto) {
    return this.service.startSession(dto);
  }

  @Post('session/:id/complete')
  completeSession(
    @Param('id') id: string,
    @Body() dto: CompleteDicteeSessionDto,
  ) {
    return this.service.completeSession(id, dto);
  }
}
