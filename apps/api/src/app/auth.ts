import { Lucia } from 'lucia';
import { PostgresJsAdapter } from '@lucia-auth/adapter-postgresql';
import postgres from 'postgres';

export let lucia: Lucia;

export const setPsqlClient = (psqlClient: postgres.Sql) => {
  const adapter = new PostgresJsAdapter(psqlClient, {
    user: 'accounts',
    session: 'account_session',
  });

  lucia = new Lucia(adapter, {
    getUserAttributes: (attributes) => {
      return {
        googleId: attributes.google_id,
        email: attributes.email,
      };
    },
  });
};

export async function validateSession(sessionId: string) {
  return lucia.validateSession(sessionId);
}

export async function createUserSessionCookie(userId: string) {
  const session = await lucia.createSession(userId, {});

  return lucia.createSessionCookie(session.id);
}

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: DatabaseUserAttributes;
  }
}

interface DatabaseUserAttributes {
  name: string;
  google_id: number;
  email: string;
}
