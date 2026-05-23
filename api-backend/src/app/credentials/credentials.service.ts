import { Injectable, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '@iot-workspace/core';
import { CreateCredentialDto } from '@iot-workspace/interfaces';

@Injectable()
export class CredentialsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async assign(dto: CreateCredentialDto) {
    const client = this.supabaseService.getClient();

    // Check if the credential already exists
    const { data: existing } = await client
      .from('credenciales')
      .select('id')
      .eq('uid_hex', dto.uidHex)
      .maybeSingle();

    if (existing) {
      throw new ConflictException('Esta tarjeta ya está registrada en el sistema');
    }

    // Insert the new credential mapped to snake_case
    const { data, error } = await client
      .from('credenciales')
      .insert({
        usuario_id: dto.usuarioId,
        uid_hex: dto.uidHex,
        tipo: dto.tipo,
      })
      .select()
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(`Error al asignar credencial: ${error.message}`);
    }

    return data;
  }
}
