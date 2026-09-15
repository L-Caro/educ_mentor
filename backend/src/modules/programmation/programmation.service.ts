import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProgrammationProgression } from './entities/programmation-progression.entity';
import type { Parcours } from './dto/programmation.dto';

export interface EtatParcours {
  parcours: string;
  etape_atteinte: number;
  niveaux_reussis: number;
}

@Injectable()
export class ProgrammationService {
  constructor(
    @InjectRepository(ProgrammationProgression)
    private readonly repo: Repository<ProgrammationProgression>,
  ) {}

  async getEtat(): Promise<EtatParcours[]> {
    const lignes = await this.repo.find();
    return lignes.map((ligne) => ({
      parcours: ligne.parcours,
      etape_atteinte: ligne.etape_atteinte,
      niveaux_reussis: ligne.niveaux_reussis,
    }));
  }

  /**
   * Enregistre une etape terminee.
   *
   * L'etape atteinte ne RECULE jamais. Rejouer un niveau facile pour le plaisir est une
   * chose qu'on fait souvent a sept ans, et cela ne doit pas refermer ce qui a ete
   * ouvert : sans ce garde-fou, revenir s'amuser sur le premier parcours effacerait tout
   * ce qui suit.
   */
  async enregistrerReussite(
    parcours: Parcours,
    etape: number,
  ): Promise<EtatParcours> {
    const ligne =
      (await this.repo.findOneBy({ parcours })) ??
      this.repo.create({
        id: randomUUID(),
        parcours,
        etape_atteinte: 0,
        niveaux_reussis: 0,
      });

    ligne.etape_atteinte = Math.max(ligne.etape_atteinte, etape);
    ligne.niveaux_reussis += 1;
    ligne.last_seen = new Date();
    await this.repo.save(ligne);

    return {
      parcours: ligne.parcours,
      etape_atteinte: ligne.etape_atteinte,
      niveaux_reussis: ligne.niveaux_reussis,
    };
  }
}
