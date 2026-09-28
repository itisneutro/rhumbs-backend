import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterUserDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  login: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password: string;
}
