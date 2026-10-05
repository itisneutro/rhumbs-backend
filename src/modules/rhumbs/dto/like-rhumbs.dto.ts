import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt } from 'class-validator';

export class LikeRhumbsDto {
  @ApiProperty({
    example: 1,
    enum: [0, 1],
    description: '1 — поставить лайк, 0 — снять',
  })
  @Type(() => Number)
  @IsInt()
  @IsIn([0, 1])
  isLiked: number;
}
