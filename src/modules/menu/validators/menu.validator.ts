import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Menu } from '../entities/menu.entity';

export class MenuValidator {
  constructor(private readonly manager: EntityManager) {}

  /* =========================
     EXISTENCE
  ========================= */

  async ensureExists(id: number): Promise<Menu> {
    const menu = await this.manager.findOne(Menu, {
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });

    if (!menu) {
      throw new NotFoundException('Menu not found');
    }

    return menu;
  }

  async validateParent(parentId: number | null): Promise<void> {
    if (!parentId) return;

    const exists = await this.manager.exists(Menu, {
      where: { id: parentId },
    });

    if (!exists) {
      throw new BadRequestException('Invalid parent_id');
    }
  }

  /* =========================
     UNIQUE TITLE
  ========================= */

  async validateUniqueTitle(
    parentId: number | null,
    title: string,
    ignoreId?: number,
  ): Promise<void> {
    const qb = this.manager
      .createQueryBuilder(Menu, 'menu')
      .where('menu.parent_id <=> :parentId', { parentId })
      .andWhere('menu.title = :title', { title });

    if (ignoreId) {
      qb.andWhere('menu.id != :ignoreId', { ignoreId });
    }

    const exists = await qb.getExists();

    if (exists) {
      throw new ConflictException('Title already exists in this parent');
    }
  }

  /* =========================
     CIRCULAR PROTECTION
  ========================= */

  async validateNoCircularReference(
    id: number,
    newParentId: number | null,
  ): Promise<void> {
    if (!newParentId) return;

    if (id === newParentId) {
      throw new BadRequestException('Cannot move menu into itself');
    }

    let current: number | null = newParentId;

    while (current !== null) {
      const parent = await this.manager.findOne(Menu, {
        where: { id: current },
      });

      if (!parent) break;

      if (parent.parent_id === id) {
        throw new BadRequestException('Circular reference detected');
      }

      current = parent.parent_id;
    }
  }

  /* =========================
     ORDER VALIDATION
  ========================= */

  validateOrderRange(newIndex: number, maxIndex: number): void {
    if (!Number.isInteger(newIndex)) {
      throw new BadRequestException('Order index must be integer');
    }

    if (newIndex < 1 || newIndex > maxIndex) {
      throw new BadRequestException('Invalid order index');
    }
  }
}
