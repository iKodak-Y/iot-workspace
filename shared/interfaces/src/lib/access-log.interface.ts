import { CredentialType } from './credential.interface';
import { IUser } from './user.interface';

export interface IAccessLog {
  id: number;
  uidLeido: string;
  autorizado: boolean;
  motivo: string;
  fechaHora: string;
  puntoAccesoId: string;
  credencial?: {
    tipo: CredentialType;
    usuario: Pick<IUser, 'nombreCompleto' | 'bloqueVilla'>;
  };
}
