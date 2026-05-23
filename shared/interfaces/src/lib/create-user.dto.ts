import { IsNotEmpty, IsString, IsIn, IsOptional, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  @IsString({ message: 'El nombre completo debe ser una cadena de texto' })
  nombreCompleto!: string;

  @IsNotEmpty({ message: 'El bloque/villa es requerido' })
  @IsString({ message: 'El bloque/villa debe ser una cadena de texto' })
  bloqueVilla!: string;

  @IsNotEmpty({ message: 'El rol es requerido' })
  @IsIn(['admin', 'guardia', 'residente'], { message: 'El rol debe ser admin, guardia o residente' })
  rol!: string;

  @IsOptional()
  @IsEmail({}, { message: 'El correo debe tener un formato válido' })
  correo?: string;

  @IsOptional()
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  password?: string;
}
