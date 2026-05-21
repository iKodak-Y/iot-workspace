export type UserRole = 'admin' | 'guardia' | 'residente';

export interface IUser {
  id: string;
  nombreCompleto: string;
  bloqueVilla: string;
  rol: UserRole;
  estado: boolean;
  createdAt: string;
}
