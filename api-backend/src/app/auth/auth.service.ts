import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SupabaseService } from '@iot-workspace/core';
import { IAuthResponseDto, ILoginDto } from '@iot-workspace/interfaces';
import * as bcrypt from 'bcrypt';
import { SupabaseClient } from '@supabase/supabase-js';

type UsuarioAuth = {
  id: string;
  nombre_completo: string;
  rol: string;
  estado: boolean;
  correo: string;
  password_hash: string;
};

@Injectable()
export class AuthService {
  public constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
  ) {}

  public async login(dto: ILoginDto): Promise<IAuthResponseDto> {
    const client: SupabaseClient = this.supabaseService.getClient();
    const { data, error }: { data: UsuarioAuth | null; error: Error | null } =
      await client
        .from('usuarios')
        .select('id, nombre_completo, rol, estado, correo, password_hash')
        .eq('correo', dto.correo)
        .maybeSingle();

    if (error || !data) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValido: boolean = bcrypt.compareSync(
      dto.password,
      data.password_hash,
    );

    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!data.estado) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    const payload: { sub: string; rol: string } = {
      sub: data.id,
      rol: data.rol,
    };

    const accessToken: string = this.jwtService.sign(payload);

    return {
      accessToken,
      usuario: {
        id: data.id,
        nombreCompleto: data.nombre_completo,
        rol: data.rol,
      },
    };
  }

  public async setupAdmin(dto: ILoginDto): Promise<string> {
    const client: SupabaseClient = this.supabaseService.getClient();
    const passwordHash: string = bcrypt.hashSync(dto.password, 10);

    await client.from('usuarios').insert({
      nombre_completo: 'Administrador Principal',
      bloque_villa: 'Oficina',
      rol: 'admin',
      correo: dto.correo,
      password_hash: passwordHash,
    });

    return 'Administrador creado correctamente.';
  }
}
