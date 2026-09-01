import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

/** Une unité à dicter : un mot (débutant), une phrase (normal) ou un paragraphe
 * (difficile). Le contenu porte accents, ponctuation et majuscules réels. */
@Entity('dictee_items')
export class DicteeItem {
  @PrimaryColumn()
  id: string; // uuid

  @Column({ type: 'text' })
  niveau: string; // 'debutant' | 'normal' | 'difficile'

  @Column({ type: 'text' })
  contenu: string;

  /** Notions d'orthographe travaillées, issues du vocabulaire contrôlé du skill. */
  @Column('simple-json')
  notions: string[];

  @Column({ type: 'boolean', default: false })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;
}
