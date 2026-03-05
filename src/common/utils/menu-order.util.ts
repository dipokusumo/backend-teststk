import { EntityManager, IsNull } from 'typeorm';
import { Menu } from '../../modules/menu/entities/menu.entity';

export async function lockSiblings(
  manager: EntityManager,
  parentId: number | null,
) {
  return manager.find(Menu, {
    where: parentId ? { parent_id: parentId } : { parent_id: IsNull() },
    order: { order_index: 'ASC' },
    lock: { mode: 'pessimistic_write' },
  });
}

export async function getNextOrderIndex(
  manager: EntityManager,
  parentId: number | null,
): Promise<number> {
  const siblings = await lockSiblings(manager, parentId);

  if (!siblings.length) return 1;

  return siblings[siblings.length - 1].order_index + 1;
}

export async function normalizeOrder(
  manager: EntityManager,
  parentId: number | null,
) {
  const siblings = await lockSiblings(manager, parentId);

  for (let i = 0; i < siblings.length; i++) {
    siblings[i].order_index = i + 1;
  }

  await manager.save(Menu, siblings);
}
