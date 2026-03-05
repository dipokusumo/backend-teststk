import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MoveMenuDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  new_parent_id?: number;
}
