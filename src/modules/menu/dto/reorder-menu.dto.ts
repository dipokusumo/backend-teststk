import { IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ReorderMenuDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  new_order_index: number;
}
