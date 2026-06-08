import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Invitation } from './entities/invitation.entity';

@Injectable()
export class InvitationService {
  constructor(
    @InjectRepository(Invitation)
    private readonly repo: Repository<Invitation>,
  ) {}

  async create(label: string): Promise<Invitation> {
    const invitation = this.repo.create({ token: uuidv4(), label });
    return this.repo.save(invitation);
  }

  findAll(): Promise<Invitation[]> {
    return this.repo.find({ order: { created_at: 'DESC' } });
  }

  findByToken(token: string): Promise<Invitation | null> {
    return this.repo.findOneBy({ token });
  }

  /** Marque le token comme utilisé. Appelé une seule fois au premier clic sur le lien. */
  async markAsUsed(invitationId: string): Promise<void> {
    const invitation = await this.repo.findOneBy({ id: invitationId });
    if (!invitation) throw new NotFoundException('Invitation introuvable');
    await this.repo.update(invitationId, { used_at: new Date() });
  }
}
