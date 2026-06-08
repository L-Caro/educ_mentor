import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('imagier_words')
export class ImagierWord {
  @PrimaryColumn()
  id: string; // uuid

  @Column({ unique: true })
  slug: string; // version normalisée du mot FR (url-safe)

  @Column()
  fr: string; // mot français original

  @Column()
  en: string; // mot anglais

  @Column()
  category: string; // ex: 'animaux'

  @Column({ nullable: true })
  subcategory: string; // ex: 'mammiferes'

  @Column({ nullable: true })
  image_filename: string; // ex: 'chat.webp' — null si pas d'image

  @Column({ default: false })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;
}
