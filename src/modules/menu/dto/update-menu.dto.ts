import { IsString, IsOptional, MaxLength, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateMenuDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parent_id?: number;
}
