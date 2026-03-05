import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Menu } from './entities/menu.entity';
import { CreateMenuDto } from './dto/create-menu.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MoveMenuDto } from './dto/move-menu.dto';
import { ReorderMenuDto } from './dto/reorder-menu.dto';
import {
  lockSiblings,
  getNextOrderIndex,
  normalizeOrder,
} from 'src/common/utils/menu-order.util';
import { runWithRetry } from 'src/common/utils/transaction.util';
import { handleDbException } from 'src/common/utils/db-exception.util';
import { MenuValidator } from './validators/menu.validator';

@Injectable()
export class MenusService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepo: Repository<Menu>,
    private readonly dataSource: DataSource,
  ) {}

  /* =========================
     READ
  ========================= */

  async findAll(): Promise<Menu[]> {
    const menus = await this.menuRepo.find({
      order: { order_index: 'ASC' },
    });

    return this.buildTree(menus);
  }

  async findOne(id: number): Promise<Menu> {
    const menu = await this.menuRepo.findOne({
      where: { id },
      relations: ['children'],
    });

    if (!menu) {
      throw new Error('Menu not found');
    }

    return menu;
  }

  /* =========================
     CREATE
  ========================= */

  async create(dto: CreateMenuDto): Promise<Menu> {
    try {
      return await runWithRetry(this.dataSource, async (manager) => {
        const validator = new MenuValidator(manager);
        const parentId = dto.parent_id ?? null;

        await validator.validateParent(parentId);
        await validator.validateUniqueTitle(parentId, dto.title);

        const nextIndex = await getNextOrderIndex(manager, parentId);

        const menu = manager.create(Menu, {
          ...dto,
          parent_id: parentId,
          order_index: nextIndex,
        });

        return manager.save(menu);
      });
    } catch (error) {
      handleDbException(error);
    }
  }

  /* =========================
     UPDATE
  ========================= */

  async update(id: number, dto: UpdateMenuDto): Promise<Menu> {
    try {
      return await runWithRetry(this.dataSource, async (manager) => {
        const validator = new MenuValidator(manager);
        const menu = await validator.ensureExists(id);

        if (dto.title) {
          await validator.validateUniqueTitle(
            dto.parent_id ?? menu.parent_id,
            dto.title,
            id,
          );
        }

        Object.assign(menu, dto);

        return manager.save(menu);
      });
    } catch (error) {
      handleDbException(error);
    }
  }

  /* =========================
     DELETE
  ========================= */

  async delete(id: number) {
    try {
      return await runWithRetry(this.dataSource, async (manager) => {
        const validator = new MenuValidator(manager);
        const menu = await validator.ensureExists(id);

        const parentId = menu.parent_id ?? null;

        await manager.delete(Menu, { id });

        await normalizeOrder(manager, parentId);

        return { message: 'Deleted successfully' };
      });
    } catch (error) {
      handleDbException(error);
    }
  }

  /* =========================
     MOVE
  ========================= */

  async move(id: number, dto: MoveMenuDto): Promise<Menu> {
    try {
      return await runWithRetry(this.dataSource, async (manager) => {
        const validator = new MenuValidator(manager);
        const menu = await validator.ensureExists(id);

        const oldParent = menu.parent_id ?? null;
        const newParent = dto.new_parent_id ?? null;

        await validator.validateParent(newParent);
        await validator.validateUniqueTitle(newParent, menu.title);
        await validator.validateNoCircularReference(id, newParent);

        if (oldParent !== newParent) {
          await lockSiblings(manager, oldParent);
        }

        await lockSiblings(manager, newParent);

        menu.parent_id = newParent;
        menu.order_index = await getNextOrderIndex(manager, newParent);

        await manager.save(menu);

        await normalizeOrder(manager, oldParent);

        return menu;
      });
    } catch (error) {
      handleDbException(error);
    }
  }

  /* =========================
     REORDER
  ========================= */

  async reorder(id: number, dto: ReorderMenuDto): Promise<Menu> {
    try {
      return await runWithRetry(this.dataSource, async (manager) => {
        const validator = new MenuValidator(manager);
        const menu = await validator.ensureExists(id);

        const parentId = menu.parent_id ?? null;
        const newIndex = dto.new_order_index;

        const siblings = await lockSiblings(manager, parentId);

        validator.validateOrderRange(newIndex, siblings.length);

        const oldIndex = menu.order_index;
        if (oldIndex === newIndex) return menu;

        if (oldIndex < newIndex) {
          await manager
            .createQueryBuilder()
            .update(Menu)
            .set({
              order_index: () => 'order_index - 1',
            })
            .where('parent_id <=> :parentId', {
              parentId,
            })
            .andWhere('order_index > :oldIndex', {
              oldIndex,
            })
            .andWhere('order_index <= :newIndex', {
              newIndex,
            })
            .execute();
        } else {
          await manager
            .createQueryBuilder()
            .update(Menu)
            .set({
              order_index: () => 'order_index + 1',
            })
            .where('parent_id <=> :parentId', {
              parentId,
            })
            .andWhere('order_index >= :newIndex', {
              newIndex,
            })
            .andWhere('order_index < :oldIndex', {
              oldIndex,
            })
            .execute();
        }

        menu.order_index = newIndex;
        return manager.save(menu);
      });
    } catch (error) {
      handleDbException(error);
    }
  }

  /* =========================
     TREE BUILDER
  ========================= */

  private buildTree(menus: Menu[]): Menu[] {
    const map = new Map<number, Menu>();
    const roots: Menu[] = [];

    menus.forEach((menu) => {
      menu.children = [];
      map.set(menu.id, menu);
    });

    menus.forEach((menu) => {
      if (menu.parent_id) {
        map.get(menu.parent_id)?.children.push(menu);
      } else {
        roots.push(menu);
      }
    });

    return roots;
  }
}
