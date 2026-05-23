import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '@iot-workspace/core';
import { CreateUserDto } from '@iot-workspace/interfaces';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll() {
    const client = this.supabaseService.getClient();
    const { data, error } = await client
      .from('usuarios')
      .select('id, nombre_completo, bloque_villa, rol, estado, correo, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new InternalServerErrorException('Error al obtener usuarios');
    }

    return data;
  }

  async create(dto: CreateUserDto) {
    const client = this.supabaseService.getClient();
    
    // Map DTO to DB schema (snake_case)
    const newUser: any = {
      nombre_completo: dto.nombreCompleto,
      bloque_villa: dto.bloqueVilla,
      rol: dto.rol,
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

    return data;
  }
}
