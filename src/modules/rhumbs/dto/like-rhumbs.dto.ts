import { Type } from 'class-transformer';
import { IsIn, IsInt } from 'class-validator';

export class LikeRhumbsDto {
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  value: number;
}
