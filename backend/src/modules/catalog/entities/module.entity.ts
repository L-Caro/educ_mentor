import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('modules')
export class AppModule {
  @PrimaryColumn()
  id: string; // slug : 'imagier-anglais'

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string; // emoji

  @Column({ default: false })
  is_active: boolean;

  @Column({ default: 0 })
  display_order: number;

  @CreateDateColumn()
  created_at: Date;
}
