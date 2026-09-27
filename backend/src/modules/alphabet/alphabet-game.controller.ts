import { Body, Controller, Post } from '@nestjs/common';
import { AlphabetService } from './alphabet.service';
import { StartAlphabetSessionDto } from './dto/alphabet.dto';

@Controller('alphabet')
export class AlphabetGameController {
  constructor(private readonly service: AlphabetService) {}

  @Post('session')
  start(@Body() dto: StartAlphabetSessionDto) {
    return this.service.startSession(dto);
  }
}
