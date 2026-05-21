import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

type SupabaseEnv = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
};

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger: Logger = new Logger(SupabaseService.name);
  private client!: SupabaseClient;

  public constructor(
    private readonly configService: ConfigService<SupabaseEnv>,
  ) {}

  public onModuleInit(): void {
    try {
      const supabaseUrl: string | undefined =
        this.configService.get<string>('SUPABASE_URL');
      const supabaseServiceKey: string | undefined =
        this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

      if (!supabaseUrl || !supabaseServiceKey) {
        const mensaje: string =
          'Faltan las variables de entorno SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY para inicializar Supabase.';
        this.logger.error(mensaje);
        throw new Error(mensaje);
      }

      this.client = createClient(supabaseUrl, supabaseServiceKey);
    } catch (error: unknown) {
      const mensaje: string =
        'Error al inicializar el cliente de Supabase en el módulo Core.';
      const stack: string | undefined =
        error instanceof Error ? error.stack : undefined;
      this.logger.error(mensaje, stack);
      throw new Error(mensaje);
    }
  }

  public getClient(): SupabaseClient {
    return this.client;
  }
}
