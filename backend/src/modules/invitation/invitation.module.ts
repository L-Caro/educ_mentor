import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invitation } from './entities/invitation.entity';
import { InvitationService } from './invitation.service';
import { InvitationAdminController } from './invitation-admin.controller';
import { InvitationPublicController } from './invitation-public.controller';
import { AuthModule } from '../auth/auth.module';

/** InvitationService est exporté : consommé par AccessGuard pour valider le cookie.
 * AuthModule est importé pour que JwtAuthGuard soit disponible dans le contrôleur admin. */
@Module({
  imports: [TypeOrmModule.forFeature([Invitation]), AuthModule],
  providers: [InvitationService],
  controllers: [InvitationAdminController, InvitationPublicController],
  exports: [InvitationService],
})
export class InvitationModule {}
