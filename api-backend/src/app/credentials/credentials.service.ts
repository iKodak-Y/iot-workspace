import { Injectable, InternalServerErrorException, ConflictException } from '@nestjs/common';
import { SupabaseService } from '@iot-workspace/core';
import { CreateCredentialDto } from '@iot-workspace/interfaces';

@Injectable()
export class CredentialsService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async assign(dto: CreateCredentialDto) {
    const client = this.supabaseService.getClient();

    const credentialPayload = dto.tipo === 'smartphone_nfc'
      ? {
          usuario_id: dto.usuarioId,
          uid_hex: dto.uidHex,
          device_token: dto.uidHex,
          device_token_updated_at: new Date().toISOString(),
          tipo: dto.tipo,
        }
      : {
          usuario_id: dto.usuarioId,
          uid_hex: dto.uidHex,
          tipo: dto.tipo,
        };

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
      .insert(credentialPayload)
      .select()
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(`Error al asignar credencial: ${error.message}`);
    }

    return data;
  }

  async getByUserId(userId: string) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('credenciales')
      .select('*')
      .eq('usuario_id', userId);

    if (error) {
      console.error('Supabase getByUserId error:', error);
      throw new InternalServerErrorException(`Error al obtener credenciales: ${error.message}`);
    }

    return data;
  }

  async remove(id: string) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('credenciales')
      .delete()
      .eq('id', id)
      .select();

    if (error) {
      throw new InternalServerErrorException(`Error al eliminar credencial: ${error.message}`);
    }

    return { success: true, deleted: data };
  }
}
