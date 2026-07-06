import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('memory_sessions')
export class MemorySession {
  @PrimaryColumn()
  id: string;

  @Column({ type: 'int' })
  pairs_count: number;

  @Column()
  mode: string;

  @Column({ type: 'text' })
  categories: string; // JSON array

  @Column({ type: 'int', nullable: true })
  attempts: number | null;

  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  started_at: Date;

  @Column({ type: 'datetime', nullable: true })
  completed_at: Date | null;
}