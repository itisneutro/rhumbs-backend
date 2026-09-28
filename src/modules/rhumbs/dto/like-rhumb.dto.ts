import { Type } from 'class-transformer';
import { IsIn, IsInt } from 'class-validator';

export class LikeRhumbDto {
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  value: number;
}
