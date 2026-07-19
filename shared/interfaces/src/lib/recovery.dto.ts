import { IsNotEmpty, IsString, Length } from 'class-validator';

export class IRecoveryDto {
  @IsNotEmpty()
  @IsString()
  @Length(8, 8)
  public recoveryCode!: string;
}