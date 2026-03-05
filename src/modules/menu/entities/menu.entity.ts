import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';

@Entity('menus')
@Index(['parent_id'])
@Index(['parent_id', 'order_index'], { unique: true })
@Index(['parent_id', 'title'], { unique: true })
export class Menu {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ length: 150 })
  title: string;

  @Column({ type: 'int', nullable: true })
  parent_id: number | null;

  @Column({ type: 'int' })
  order_index: number;

  @ManyToOne(() => Menu, (menu) => menu.children, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parent_id' })
  parent: Menu;
  @OneToMany(() => Menu, (menu) => menu.parent)
  children: Menu[];
}
