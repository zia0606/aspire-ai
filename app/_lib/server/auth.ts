import { betterAuth } from "better-auth";
import { getDatabasePool } from "./database";

function createAspireAuth(
  database: NonNullable<ReturnType<typeof getDatabasePool>>,
  secret: string,
) {
  return betterAuth({
    database,
    secret,
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    advanced: {
      database: {
        generateId: "uuid",
      },
    },
  });
}

type AspireAuth = ReturnType<typeof createAspireAuth>;
let authInstance: AspireAuth | null = null;

export function isAuthConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET);
}

export function getAuth() {
  if (authInstance) return authInstance;

  const secret = process.env.BETTER_AUTH_SECRET;
  const database = getDatabasePool();
  if (!secret || !database) return null;

  authInstance = createAspireAuth(database, secret);
  return authInstance;
}
