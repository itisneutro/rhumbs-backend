import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({ example: 'n.vasilev', maxLength: 64 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  login: string;

  @ApiProperty({ example: 'rhumbs2026', maxLength: 72 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password: string;
}
