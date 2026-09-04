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
    sessionCookie: {
      attributes: {
        // Only mark the cookie as Secure when the API is served over HTTPS.
        // Over plain HTTP (local dev and the default Docker setup) a Secure
        // cookie would be silently dropped by the browser, breaking sessions.
        secure: (process.env['API_URL'] ?? '').startsWith('https'),
      },
    },
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
