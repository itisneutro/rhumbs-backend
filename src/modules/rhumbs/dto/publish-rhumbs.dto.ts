import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class PublishRhumbsDto {
  @ApiProperty({ example: 'Северо-западный', maxLength: 64 })
  @IsString()
  @MaxLength(64)
  name: string;

  @ApiProperty({ example: 'Ветер с северо-запада.', maxLength: 512 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  description: string;

  @ApiProperty({ example: 315, minimum: 0, maximum: 359, description: 'Целые градусы' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(359)
  geoAzimuth: number;

  @ApiProperty({ example: 303.5, minimum: 0, maximum: 359.9, description: 'Градусы с одним знаком после запятой' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(359.9)
  magAzimuth: number;
}
