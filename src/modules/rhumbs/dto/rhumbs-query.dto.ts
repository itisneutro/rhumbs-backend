import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, Max, Min } from 'class-validator';

export class RhumbsQueryDto {
  @ApiPropertyOptional({ example: 90, minimum: 0, maximum: 359 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(359)
  minAzimuth?: number;
}

export class RhumbsFeedQueryDto {
  @ApiPropertyOptional({ example: true, description: 'true — следующий румб по кругу' })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) {
      return true;
    }

    if (value === 'false' || value === false) {
      return false;
    }

    return value;
  })
  @IsBoolean()
  next?: boolean;
}
