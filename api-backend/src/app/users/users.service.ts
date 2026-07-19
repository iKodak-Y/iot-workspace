import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '@iot-workspace/core';
import { CreateUserDto } from '@iot-workspace/interfaces';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'crypto';

function generateActivationCode(): string {
  return randomInt(0, 1000000).toString().padStart(6, '0');
}

function generateRecoveryCode(): string {
  return randomInt(0, 100000000).toString().padStart(8, '0');
}

async function generateUniqueActivationCode(client: ReturnType<SupabaseService['getClient']>): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const activationCode = generateActivationCode();
    const { data } = await client
      .from('usuarios')
      .select('id')
      .eq('activation_code', activationCode)
      .maybeSingle();

    if (!data) {
      return activationCode;
    }
  }

  throw new InternalServerErrorException('No se pudo generar un código temporal único');
}

async function generateUniqueRecoveryCode(client: ReturnType<SupabaseService['getClient']>): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const recoveryCode = generateRecoveryCode();
    const { data } = await client
      .from('usuarios')
      .select('id')
      .eq('recovery_code', recoveryCode)
      .maybeSingle();

    if (!data) {
      return recoveryCode;
    }
  }

  throw new InternalServerErrorException('No se pudo generar un código de recuperación único');
}

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const client = this.supabaseService.getClient();
    const [{ data: users, error: usersError }, { data: smartphoneCredentials, error: credentialsError }] = await Promise.all([
      client
        .from('usuarios')
        .select('id, nombre_completo, bloque_villa, rol, estado, correo, created_at')
        .order('created_at', { ascending: false }),
      client
        .from('credenciales')
        .select('usuario_id, activo, updated_at')
        .eq('tipo', 'smartphone_nfc')
        .order('updated_at', { ascending: false }),
    ]);

    if (usersError || credentialsError) {
      throw new InternalServerErrorException('Error al obtener usuarios');
    }

    const smartphoneCredentialByUserId = new Map<string, { activo: boolean; updated_at: string }>();

    for (const credential of smartphoneCredentials ?? []) {
      if (!smartphoneCredentialByUserId.has(credential.usuario_id)) {
        smartphoneCredentialByUserId.set(credential.usuario_id, {
          activo: credential.activo,
          updated_at: credential.updated_at,
        });
      }
    }

    return (users ?? []).map((user) => {
      const smartphoneCredential = smartphoneCredentialByUserId.get(user.id) ?? null;

      return {
        ...user,
        has_smartphone_credential: smartphoneCredential !== null,
        smartphone_credential_active: smartphoneCredential?.activo ?? false,
        smartphone_credential_updated_at: smartphoneCredential?.updated_at ?? null,
      };
    });
  }

  async create(dto: CreateUserDto) {
    const client = this.supabaseService.getClient();
    const activationCode = await generateUniqueActivationCode(client);
    const recoveryCode = await generateUniqueRecoveryCode(client);
    const activationCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    
    // Map DTO to DB schema (snake_case)
    const newUser: any = {
      nombre_completo: dto.nombreCompleto,
      bloque_villa: dto.bloqueVilla,
      rol: dto.rol,
      activation_code: activationCode,
      activation_code_expires_at: activationCodeExpiresAt,
      recovery_code: recoveryCode,
    };

    if (dto.correo) {
      newUser.correo = dto.correo;
    }

    if (dto.password) {
      newUser.password_hash = bcrypt.hashSync(dto.password, 10);
    }

    const { data, error } = await client
      .from('usuarios')
      .insert(newUser)
      .select()
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(`Error al crear usuario: ${error.message}`);
    }

    return {
      user: data,
      activationCode,
      recoveryCode,
      activationCodeExpiresAt,
    };
  }

  async getRecoveryCode(id: string) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('usuarios')
      .select('id, nombre_completo, recovery_code')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(`Error al obtener el código de recuperación: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException('No se encontró el usuario');
    }

    return {
      user: {
        id: data.id,
        nombreCompleto: data.nombre_completo,
      },
      recoveryCode: data.recovery_code,
    };
  }

  async rotateRecoveryCode(id: string) {
    const client = this.supabaseService.getClient();
    const recoveryCode = await generateUniqueRecoveryCode(client);

    const { data, error } = await client
      .from('usuarios')
      .update({ recovery_code: recoveryCode })
      .eq('id', id)
      .select('id, nombre_completo, recovery_code')
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(`Error al regenerar el código de recuperación: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException('No se encontró el usuario');
    }

    return {
      user: {
        id: data.id,
        nombreCompleto: data.nombre_completo,
      },
      recoveryCode: data.recovery_code,
    };
  }

  async toggleStatus(id: string, estado: boolean) {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('usuarios')
      .update({ estado })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(`Error al actualizar estado del usuario: ${error.message}`);
    }

    return data;
  }
}
