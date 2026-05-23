import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '@iot-workspace/core';
import { IAccessResponseDto, IValidateAccessDto } from '@iot-workspace/interfaces';
import { SupabaseClient } from '@supabase/supabase-js';
import { AccessGateway } from './access.gateway';

type CredencialUsuario = {
  id: number;
  activo: boolean;
  usuarios: {
    estado: boolean;
    nombre_completo: string;
    bloque_villa: string;
  } | null;
};

@Injectable()
export class AccessService {
  private readonly logger: Logger = new Logger(AccessService.name);

  public constructor(
    private readonly supabaseService: SupabaseService,
    private readonly accessGateway: AccessGateway,
  ) {}

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
        .select('id, activo, usuarios(estado, nombre_completo, bloque_villa)')
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

        this.accessGateway.server.emit('nuevo-acceso', {
          uid_leido: dto.uidHex,
          autorizado: false,
          motivo: 'Tag Desconocido',
          punto_acceso_id: dto.puntoAccesoId,
          fecha_hora: new Date().toISOString(),
          nombre_completo: 'Tag Desconocido',
          bloque_villa: 'N/A',
        });

        return {
          autorizado: false,
          mensaje: 'Acceso Denegado: Tag Desconocido',
        };
      }

      const usuarioActivo: boolean = Boolean(credencial.usuarios?.estado);
      const credencialActiva: boolean = Boolean(credencial.activo);

      if (credencial.usuarios?.estado === false) {
        await client.from('registro_accesos').insert({
          uid_leido: dto.uidHex,
          autorizado: false,
          motivo: 'Usuario Suspendido',
          punto_acceso_id: dto.puntoAccesoId,
        });

        this.accessGateway.server.emit('nuevo-acceso', {
          uid_leido: dto.uidHex,
          autorizado: false,
          motivo: 'Usuario Suspendido',
          punto_acceso_id: dto.puntoAccesoId,
          fecha_hora: new Date().toISOString(),
          nombre_completo: credencial.usuarios?.nombre_completo || 'Tag Desconocido',
          bloque_villa: credencial.usuarios?.bloque_villa || 'N/A',
        });

        return {
          autorizado: false,
          mensaje: 'Acceso Denegado: Usuario Suspendido',
        };
      }

      if (!credencialActiva || !usuarioActivo) {
        await client.from('registro_accesos').insert({
          uid_leido: dto.uidHex,
          autorizado: false,
          motivo: 'Usuario o Tarjeta Inactiva',
          punto_acceso_id: dto.puntoAccesoId,
        });

        this.accessGateway.server.emit('nuevo-acceso', {
          uid_leido: dto.uidHex,
          autorizado: false,
          motivo: 'Usuario o Tarjeta Inactiva',
          punto_acceso_id: dto.puntoAccesoId,
          fecha_hora: new Date().toISOString(),
          nombre_completo: credencial.usuarios?.nombre_completo || 'Tag Desconocido',
          bloque_villa: credencial.usuarios?.bloque_villa || 'N/A',
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

      this.accessGateway.server.emit('nuevo-acceso', {
        uid_leido: dto.uidHex,
        autorizado: true,
        motivo: 'Acceso Exitoso',
        punto_acceso_id: dto.puntoAccesoId,
        fecha_hora: new Date().toISOString(),
        nombre_completo: credencial.usuarios?.nombre_completo || 'Tag Desconocido',
        bloque_villa: credencial.usuarios?.bloque_villa || 'N/A',
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

    const { data: creds } = await client
      .from('credenciales')
      .select('uid_hex, usuarios(nombre_completo, bloque_villa)');

    const credsMap = new Map<string, { nombre_completo: string; bloque_villa: string }>();
    if (creds) {
      creds.forEach((c: any) => {
        credsMap.set(c.uid_hex, {
          nombre_completo: c.usuarios?.nombre_completo || 'Tag Desconocido',
          bloque_villa: c.usuarios?.bloque_villa || 'N/A',
        });
      });
    }

    const enrichedLogs = (data ?? []).map((log: any) => {
      const user = credsMap.get(log.uid_leido);
      return {
        ...log,
        nombre_completo: user?.nombre_completo || 'Tag Desconocido',
        bloque_villa: user?.bloque_villa || 'N/A',
      };
    });

    return enrichedLogs;
  }
}
