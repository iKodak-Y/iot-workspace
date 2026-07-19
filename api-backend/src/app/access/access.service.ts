import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { SupabaseService } from '@iot-workspace/core';
import { IAccessResponseDto, IValidateAccessDto } from '@iot-workspace/interfaces';
import { SupabaseClient } from '@supabase/supabase-js';
import { AccessGateway } from './access.gateway';

import { Subject } from 'rxjs';

type CredencialUsuario = {
  id: number;
  tipo: string;
  activo: boolean;
  usuarios: {
    estado: boolean;
    nombre_completo: string;
    bloque_villa: string;
  } | null;
};

export interface RemoteOpenEvent {
  data: {
    puntoAccesoId: string;
    timestamp: string;
  };
}

@Injectable()
export class AccessService {
  private readonly logger: Logger = new Logger(AccessService.name);
  private readonly remoteOpenSubject = new Subject<RemoteOpenEvent>();

  public constructor(
    private readonly supabaseService: SupabaseService,
    private readonly accessGateway: AccessGateway,
  ) {}

  public getRemoteOpenStream() {
    return this.remoteOpenSubject.asObservable();
  }

  public async triggerRemoteOpen(userId: string, puntoAccesoId: string) {
    const client = this.supabaseService.getClient();

    const { data: user } = await client
      .from('usuarios')
      .select('estado, nombre_completo')
      .eq('id', userId)
      .maybeSingle();

    if (!user || !user.estado) {
      return { autorizado: false, mensaje: 'Usuario suspendido o no encontrado' };
    }

    // Registrar en el historial de accesos
    await client.from('registro_accesos').insert({
      uid_leido: 'APERTURA_REMOTA',
      autorizado: true,
      motivo: 'Apertura por Botón (App)',
      punto_acceso_id: puntoAccesoId,
    });

    this.accessGateway.server.emit('nuevo-acceso', {
      uid_leido: 'APERTURA_REMOTA',
      autorizado: true,
      motivo: 'Apertura por Botón (App)',
      punto_acceso_id: puntoAccesoId,
      fecha_hora: new Date().toISOString(),
      nombre_completo: user.nombre_completo,
      bloque_villa: 'App Móvil',
    });

    // Emitir el evento para el ESP32 a través de SSE
    this.remoteOpenSubject.next({
      data: {
        puntoAccesoId,
        timestamp: new Date().toISOString(),
      },
    });

    return { autorizado: true, mensaje: 'Puerta Abierta' };
  }

  public async validateAccess(
    dto: IValidateAccessDto,
  ): Promise<IAccessResponseDto> {
    const client: SupabaseClient = this.supabaseService.getClient();

    try {
      const byUid = await client
        .from('credenciales')
        .select('id, tipo, activo, usuarios(estado, nombre_completo, bloque_villa)')
        .eq('uid_hex', dto.uidHex)
        .maybeSingle();

      const byDeviceToken = byUid.data
        ? { data: null as CredencialUsuario | null, error: null as Error | null }
        : await client
            .from('credenciales')
            .select('id, tipo, activo, usuarios(estado, nombre_completo, bloque_villa)')
            .eq('device_token', dto.uidHex)
            .maybeSingle();

      const credencial = byUid.data ?? byDeviceToken.data;
      const credencialError = byUid.error ?? byDeviceToken.error;

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
      const credencialEsTelefono: boolean = credencial.tipo === 'smartphone_nfc';

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
        motivo: credencialEsTelefono ? 'Acceso Exitoso: Teléfono NFC' : 'Acceso Exitoso',
        punto_acceso_id: dto.puntoAccesoId,
      });

      this.accessGateway.server.emit('nuevo-acceso', {
        uid_leido: dto.uidHex,
        autorizado: true,
        motivo: credencialEsTelefono ? 'Acceso Exitoso: Teléfono NFC' : 'Acceso Exitoso',
        punto_acceso_id: dto.puntoAccesoId,
        fecha_hora: new Date().toISOString(),
        nombre_completo: credencial.usuarios?.nombre_completo || 'Tag Desconocido',
        bloque_villa: credencial.usuarios?.bloque_villa || 'N/A',
      });

      return {
        autorizado: true,
        mensaje: credencialEsTelefono ? 'Acceso Concedido: Teléfono NFC' : 'Acceso Concedido',
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
      .select('uid_hex, device_token, usuarios(nombre_completo, bloque_villa)');

    const credsMap = new Map<string, { nombre_completo: string; bloque_villa: string }>();
    if (creds) {
      creds.forEach((c: any) => {
        credsMap.set(c.uid_hex, {
          nombre_completo: c.usuarios?.nombre_completo || 'Tag Desconocido',
          bloque_villa: c.usuarios?.bloque_villa || 'N/A',
        });

        if (c.device_token) {
          credsMap.set(c.device_token, {
            nombre_completo: c.usuarios?.nombre_completo || 'Tag Desconocido',
            bloque_villa: c.usuarios?.bloque_villa || 'N/A',
          });
        }
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
