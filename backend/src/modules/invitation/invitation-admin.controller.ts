import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvitationService } from './invitation.service';

class CreateInvitationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  label: string;
}

@Controller('admin/invitations')
@UseGuards(JwtAuthGuard)
export class InvitationAdminController {
  constructor(
    private readonly invitationService: InvitationService,
    private readonly configService: ConfigService,
  ) {}

  @Post()
  async create(@Body() dto: CreateInvitationDto) {
    const invitation = await this.invitationService.create(dto.label);
    const appUrl = this.configService.get<string>('appUrl');
    return {
      ...invitation,
      link: `${appUrl}/invite/${invitation.token}`,
    };
  }

  @Get()
  findAll() {
    return this.invitationService.findAll();
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') invitationId: string) {
    return this.invitationService.remove(invitationId);
  }
}
