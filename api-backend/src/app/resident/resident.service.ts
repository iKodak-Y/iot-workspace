import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '@iot-workspace/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

type ResidentCredential = {
  id: string;
  uid_hex: string;
  device_token: string | null;
  tipo: string;
  activo: boolean;
  updated_at: string;
};

type ResidentProfile = {
  id: string;
  nombre_completo: string;
  bloque_villa: string;
  rol: string;
  estado: boolean;
  correo: string | null;
  created_at: string;
};

type SmartphoneCredential = {
  id: string;
  uid_hex: string;
  device_token: string | null;
  tipo: string;
  activo: boolean;
  updated_at: string;
};

function generateDeviceToken(): string {
  return randomBytes(8).toString('hex').toUpperCase();
}

async function generateUniqueDeviceToken(client: SupabaseClient): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const deviceToken = generateDeviceToken();
    const { data } = await client
      .from('credenciales')
      .select('id')
      .or(`uid_hex.eq.${deviceToken},device_token.eq.${deviceToken}`)
      .maybeSingle();

    if (!data) {
      return deviceToken;
    }
  }

  throw new InternalServerErrorException('No se pudo generar un token de dispositivo único');
}

@Injectable()
export class ResidentService {
  public constructor(private readonly supabaseService: SupabaseService) {}

  public async getProfile(userId: string) {
    const client: SupabaseClient = this.supabaseService.getClient();

    const { data: user, error: userError } = await client
      .from('usuarios')
      .select('id, nombre_completo, bloque_villa, rol, estado, correo, created_at')
      .eq('id', userId)
      .maybeSingle<ResidentProfile>();

    if (userError || !user) {
      throw new NotFoundException('No se encontró el usuario autenticado');
    }

    const { data: credentials } = await client
      .from('credenciales')
      .select('id, uid_hex, device_token, tipo, activo, updated_at')
      .eq('usuario_id', userId)
      .order('updated_at', { ascending: false })
      .returns<ResidentCredential[]>();

    const smartphoneCredential = (credentials ?? [])
      .filter((credential) => credential.tipo === 'smartphone_nfc')
      .sort((left, right) => right.updated_at.localeCompare(left.updated_at))[0] ?? null;

    return {
      user: {
        id: user.id,
        nombreCompleto: user.nombre_completo,
        bloqueVilla: user.bloque_villa,
        rol: user.rol,
        estado: user.estado,
        correo: user.correo,
        createdAt: user.created_at,
      },
      credentials: (credentials ?? []).map((credential) => ({
        id: credential.id,
        uidHex: credential.uid_hex,
        deviceToken: credential.device_token,
        tipo: credential.tipo,
        activo: credential.activo,
        updatedAt: credential.updated_at,
      })),
      smartphoneCredential: smartphoneCredential
        ? {
            id: smartphoneCredential.id,
            uidHex: smartphoneCredential.uid_hex,
            deviceToken: smartphoneCredential.device_token,
            tipo: smartphoneCredential.tipo,
            activo: smartphoneCredential.activo,
            updatedAt: smartphoneCredential.updated_at,
          }
        : null,
    };
  }

  public async rotateDeviceToken(userId: string) {
    const client: SupabaseClient = this.supabaseService.getClient();
    const deviceToken = await generateUniqueDeviceToken(client);

    const { data: existingCredentials } = await client
      .from('credenciales')
      .select('id')
      .eq('usuario_id', userId)
      .eq('tipo', 'smartphone_nfc');

    if (existingCredentials && existingCredentials.length > 0) {
      await client
        .from('credenciales')
        .update({ activo: false })
        .eq('usuario_id', userId)
        .eq('tipo', 'smartphone_nfc');
    }

    const { data, error } = await client
      .from('credenciales')
      .insert({
        usuario_id: userId,
        uid_hex: deviceToken,
        device_token: deviceToken,
        device_token_updated_at: new Date().toISOString(),
        tipo: 'smartphone_nfc',
        activo: true,
      })
      .select('id, uid_hex, device_token, tipo, activo, updated_at')
      .maybeSingle<SmartphoneCredential>();

    if (error || !data) {
      throw new InternalServerErrorException(`No se pudo vincular el teléfono: ${error?.message ?? 'error desconocido'}`);
    }

    return {
      id: data.id,
      uidHex: data.uid_hex,
      deviceToken: data.device_token,
      tipo: data.tipo,
      activo: data.activo,
      updatedAt: data.updated_at,
    };
  }
}