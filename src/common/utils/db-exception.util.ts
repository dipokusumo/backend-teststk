import { BadRequestException, ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

export function handleDbException(error: unknown): never {
  if (error instanceof QueryFailedError) {
    const driverError = (error as any).driverError;

    if (!driverError) throw error;

    switch (driverError.code) {
      case 'ER_DUP_ENTRY':
        throw new ConflictException('Duplicate data detected');

      case 'ER_NO_REFERENCED_ROW_2':
        throw new BadRequestException('Invalid foreign key reference');

      case 'ER_ROW_IS_REFERENCED_2':
        throw new ConflictException('Cannot delete referenced data');
    }
  }

  throw error;
}
