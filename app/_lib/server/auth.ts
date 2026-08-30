import { betterAuth } from "better-auth";
import { getDatabasePool } from "./database";

type AspireAuth = ReturnType<typeof betterAuth>;

let authInstance: AspireAuth | null = null;

export function isAuthConfigured() {
  return Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET);
}

export function getAuth() {
  if (!isAuthConfigured()) return null;
  if (authInstance) return authInstance;

  const database = getDatabasePool();
  if (!database) return null;

  authInstance = betterAuth({
    database,
    secret: process.env.BETTER_AUTH_SECRET,
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

  return authInstance;
}
