import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateRhumbsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string;
}
