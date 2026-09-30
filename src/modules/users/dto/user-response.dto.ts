import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class UserResponseDto {
  @ApiProperty({ example: 7 })
  @Expose()
  id: number;

  @ApiProperty({ example: 'i.petrov' })
  @Expose()
  login: string;
}
