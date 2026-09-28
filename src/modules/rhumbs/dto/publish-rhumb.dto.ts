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

export class PublishRhumbDto {
  @IsString()
  @MaxLength(64)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  description: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(359)
  geographicAzimuthDeg: number;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(359.9)
  magneticAzimuthDeg: number;
}
