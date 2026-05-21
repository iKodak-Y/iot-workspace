import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '@iot-workspace/core';
import { IAccessResponseDto, IValidateAccessDto } from '@iot-workspace/interfaces';
import { SupabaseClient } from '@supabase/supabase-js';

type CredencialUsuario = {
  id: number;
  activo: boolean;
  usuarios: {
    estado: boolean;
    nombre_completo: string;
  } | null;
};

@Injectable()
export class AccessService {
  private readonly logger: Logger = new Logger(AccessService.name);

  public constructor(private readonly supabaseService: SupabaseService) {}

  public async validateAccess(
    dto: IValidateAccessDto,
  ): Promise<IAccessResponseDto> {
    const client: SupabaseClient = this.supabaseService.getClient();

    try {
      const {
        data: credencial,
        error: credencialError,
      }: {
        data: CredencialUsuario | null;
        error: Error | null;
      } = await client
        .from('credenciales')
        .select('id, activo, usuarios(estado, nombre_completo)')
        .eq('uid_hex', dto.uidHex)
        .maybeSingle();

      if (credencialError) {
        const mensajeError: string =
          'Error al consultar credenciales en Supabase.';
        this.logger.error(
          `${mensajeError} -> msg: ${credencialError.message} | details: ${credencialError.details} | hint: ${credencialError.hint}`,
        );
        return {
          autorizado: false,
          mensaje: 'Error de Servidor: Modo Offline Activado',
        };
      }

      if (!credencial) {
        await client.from('registro_accesos').insert({
          uid_leido: dto.uidHex,
          autorizado: false,
          motivo: 'Tag Desconocido',
          punto_acceso_id: dto.puntoAccesoId,
        });

        return {
          autorizado: false,
          mensaje: 'Acceso Denegado: Tag Desconocido',
        };
      }

      const usuarioActivo: boolean = Boolean(credencial.usuarios?.estado);
      const credencialActiva: boolean = Boolean(credencial.activo);

      if (!credencialActiva || !usuarioActivo) {
        await client.from('registro_accesos').insert({
          uid_leido: dto.uidHex,
          autorizado: false,
          motivo: 'Usuario o Tarjeta Inactiva',
          punto_acceso_id: dto.puntoAccesoId,
        });

        return {
          autorizado: false,
          mensaje: 'Acceso Denegado: Llave Inactiva',
        };
      }

      await client.from('registro_accesos').insert({
        uid_leido: dto.uidHex,
        autorizado: true,
        motivo: 'Acceso Exitoso',
        punto_acceso_id: dto.puntoAccesoId,
      });

      return {
        autorizado: true,
        mensaje: 'Acceso Concedido',
        nombreResidente: credencial.usuarios?.nombre_completo ?? '',
      };
    } catch (error: unknown) {
      const mensaje: string =
        'Error inesperado al validar acceso con Supabase.';
      const stack: string | undefined =
        error instanceof Error ? error.stack : undefined;
      this.logger.error(mensaje, stack);

      return {
        autorizado: false,
        mensaje: 'Error de Servidor: Modo Offline Activado',
      };
    }
  }

  public async getAccessLogs(): Promise<any[]> {
    const client: SupabaseClient = this.supabaseService.getClient();
    const {
      data,
      error,
    }: { data: Record<string, unknown>[] | null; error: Error | null } =
      await client
        .from('registro_accesos')
        .select('*')
        .order('fecha_hora', { ascending: false })
        .limit(50);

    if (error) {
      this.logger.error('Error al obtener historial:', error.message);
      throw new InternalServerErrorException('Error al obtener el historial');
    }

    return data ?? [];
  }
}
