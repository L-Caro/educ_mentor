import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('invitations')
export class Invitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Token unique envoyé dans le lien d'invitation — à usage unique. */
  @Column({ unique: true })
  token: string;

  /** Label lisible pour identifier l'appareil : "Tablette Maëve", "iPad salon". */
  @Column()
  label: string;

  @CreateDateColumn()
  created_at: Date;

  /** Null tant que le lien n'a pas été utilisé. Renseigné au premier clic. */
  @Column({ type: 'datetime', nullable: true })
  used_at: Date | null;
}
