import { Expose, Transform } from 'class-transformer';

const toNumberOrNull = ({ value }: { value: unknown }): number | null =>
  value === null || value === undefined ? null : Number(value);

export class RhumbsResponseDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  description: string | null;

  @Expose()
  imageUrl: string | null;

  @Expose()
  videoUrl: string | null;

  @Expose()
  @Transform(toNumberOrNull)
  geoAzimuth: number | null;

  @Expose()
  @Transform(toNumberOrNull)
  magAzimuth: number | null;

  @Expose()
  @Transform(({ value }) => Number(value ?? 0))
  likesCount: number;

  @Expose()
  isCreator: number;

  @Expose()
  isLiked: number;
}
