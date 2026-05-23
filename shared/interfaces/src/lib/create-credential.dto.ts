import { IsNotEmpty, IsString, IsIn, IsUUID } from 'class-validator';

export class CreateCredentialDto {
  @IsNotEmpty({ message: 'El ID de usuario es requerido' })
  @IsUUID('all', { message: 'El ID de usuario debe ser un UUID válido' })
  usuarioId!: string;

  @IsNotEmpty({ message: 'El UID Hexadecimal es requerido' })
  @IsString({ message: 'El UID Hexadecimal debe ser una cadena de texto' })
  uidHex!: string;

  @IsNotEmpty({ message: 'El tipo de credencial es requerido' })
  @IsIn(['tag_fisico', 'smartphone_nfc'], { message: 'El tipo debe ser tag_fisico o smartphone_nfc' })
  tipo!: string;
}
