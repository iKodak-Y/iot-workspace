export type CredentialType = 'tag_fisico' | 'smartphone_nfc';

export interface ICredential {
  id: string;
  uidHex: string;
  usuarioId: string;
  tipo: CredentialType;
  activo: boolean;
  updatedAt: string;
}
