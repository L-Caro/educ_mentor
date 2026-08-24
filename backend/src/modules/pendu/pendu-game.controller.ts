import { Body, Controller, Param, Post } from '@nestjs/common';
import { PenduService } from './pendu.service';
import { CompletePenduSessionDto, StartPenduSessionDto } from './dto/pendu.dto';

@Controller('pendu')
export class PenduGameController {
  constructor(private readonly penduService: PenduService) {}

  @Post('session')
  startSession(@Body() dto: StartPenduSessionDto) {
    return this.penduService.startSession(dto);
  }

  @Post('session/:id/complete')
  completeSession(
    @Param('id') id: string,
    @Body() dto: CompletePenduSessionDto,
  ) {
    return this.penduService.completeSession(id, dto);
  }
}
