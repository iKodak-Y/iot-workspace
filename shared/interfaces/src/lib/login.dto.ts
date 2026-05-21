import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ILoginDto {
  @IsNotEmpty()
  @IsEmail()
  public correo!: string;

  @IsNotEmpty()
  @IsString()
  public password!: string;
}
