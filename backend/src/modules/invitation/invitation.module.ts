import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from './entities/invitation.entity';
import { InvitationService } from './invitation.service';

/** InvitationService est exporté : il sera consommé par AuthModule (validation du token)
 * et par le futur contrôleur admin (génération + liste des invitations). */
@Module({
  imports: [TypeOrmModule.forFeature([Invitation])],
  providers: [InvitationService],
  exports: [InvitationService],
})
export class InvitationModule {}
