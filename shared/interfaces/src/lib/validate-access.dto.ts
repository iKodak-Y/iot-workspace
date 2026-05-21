import { IsHexadecimal, IsNotEmpty, IsString } from 'class-validator';

export class IValidateAccessDto {
  @IsNotEmpty()
  @IsString()
  @IsHexadecimal()
  public uidHex!: string;

  @IsNotEmpty()
  @IsString()
  public puntoAccesoId!: string;

  @IsNotEmpty()
  @IsString()
  public tokenSeguridad!: string;
}
