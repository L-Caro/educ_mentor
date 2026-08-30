import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/** Le pool de cartes du jeu Memory : figé, indépendant du module imagier.
 * Alimenté au démarrage depuis `memory-card.seed.json` si la table est vide. */
@Entity('memory_cards')
export class MemoryCard {
  @PrimaryColumn()
  id: string; // slug FR normalisé

  @Column({ unique: true })
  fr: string;

  @Column()
  en: string;

  @Column({ nullable: true })
  image_filename: string;

  @Column({ nullable: true })
  category: string; // réservé : permettre plus tard un filtre par thème

  @CreateDateColumn()
  created_at: Date;
}
