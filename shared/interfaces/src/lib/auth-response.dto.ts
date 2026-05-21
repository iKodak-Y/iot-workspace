import { IUser } from './user.interface';

export class IAuthResponseDto {
  public accessToken!: string;
  public usuario!: Pick<IUser, 'id' | 'nombreCompleto' | 'rol'>;
}
