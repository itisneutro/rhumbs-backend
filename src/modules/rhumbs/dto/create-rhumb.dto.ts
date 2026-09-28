import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateRhumbDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;
}
