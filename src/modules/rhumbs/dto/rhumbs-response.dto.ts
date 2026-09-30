import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';

const toNumberOrNull = ({ value }: { value: unknown }): number | null =>
  value === null || value === undefined ? null : Number(value);

export class RhumbsResponseDto {
  @ApiProperty({ example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'Северный' })
  @Expose()
  name: string;

  @ApiProperty({ example: 'Ветер с севера.', nullable: true })
  @Expose()
  description: string | null;

  @ApiProperty({ example: 'http://localhost:9000/rhumbs/rhumbs-north.jpg', nullable: true })
  @Expose()
  imageUrl: string | null;

  @ApiProperty({ example: 'http://localhost:9000/rhumbs/rhumbs-north.mp4', nullable: true })
  @Expose()
  videoUrl: string | null;

  @ApiProperty({ example: 0, nullable: true, description: 'Географический азимут, градусы' })
  @Expose()
  @Transform(toNumberOrNull)
  geoAzimuth: number | null;

  @ApiProperty({ example: 348.5, nullable: true, description: 'Магнитный азимут, градусы' })
  @Expose()
  @Transform(toNumberOrNull)
  magAzimuth: number | null;

  @ApiProperty({ example: 3, description: 'Число лайков' })
  @Expose()
  @Transform(({ value }) => Number(value ?? 0))
  likesCount: number;

  @ApiProperty({ example: 1, enum: [0, 1], description: '1 — румб создан текущим пользователем' })
  @Expose()
  isCreator: number;

  @ApiProperty({ example: 1, enum: [0, 1], description: '1 — лайк текущего пользователя уже стоит' })
  @Expose()
  isLiked: number;
}
