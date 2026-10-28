import { Injectable } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';

/** Lo que Google afirma del usuario. Decidir si se confia en `emailVerified` le toca a quien llama. */
export interface GoogleProfile {
  sub: string;
  email?: string;
  emailVerified: boolean;
  name?: string;
  picture?: string;
}

/** @internal Usa `GoogleIdentity` desde support/google-identity. */
@Injectable()
export class GoogleIdentity {
  private readonly clients = new Map<string, OAuth2Client>();

  /** Valida el idToken de Google para este clientId. Lanza si no es valido. */
  async verify(idToken: string, clientId: string): Promise<GoogleProfile> {
    let client = this.clients.get(clientId);
    if (!client) this.clients.set(clientId, (client = new OAuth2Client(clientId)));

    const ticket = await client.verifyIdToken({ idToken, audience: clientId });
    const data = ticket.getPayload();
    if (!data?.sub) throw new Error('token sin sub');
    return { sub: data.sub, email: data.email, emailVerified: Boolean(data.email_verified), name: data.name, picture: data.picture };
  }
}
