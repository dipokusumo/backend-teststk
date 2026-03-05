import { DataSource, EntityManager } from 'typeorm';

interface DbError extends Error {
  code?: string;
}

function isRetryableError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = (error as DbError).code;

    return code === 'ER_LOCK_DEADLOCK' || code === '40001';
  }

  return false;
}

export async function runWithRetry<T>(
  dataSource: DataSource,
  fn: (manager: EntityManager) => Promise<T>,
  retries = 3,
): Promise<T> {
  try {
    return await dataSource.transaction(fn);
  } catch (error: unknown) {
    if (retries > 0 && isRetryableError(error)) {
      return runWithRetry(dataSource, fn, retries - 1);
    }

    throw error;
  }
}
