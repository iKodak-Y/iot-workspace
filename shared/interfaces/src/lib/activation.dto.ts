import { IsNotEmpty, IsString, Length } from 'class-validator';

export class IActivationDto {
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  public activationCode!: string;
}