import { betterAuth } from "better-auth";
import { getMigrations } from "better-auth/db/migration";
import pg from "pg";

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;
const secret = process.env.BETTER_AUTH_SECRET;

if (!connectionString) {
  console.error("DATABASE_URL is missing. Add your Neon Postgres connection string first.");
  process.exit(1);
}

if (!secret) {
  console.error("BETTER_AUTH_SECRET is missing. Add a strong random secret first.");
  process.exit(1);
}

const database = new Pool({ connectionString, max: 2 });
const auth = betterAuth({
  database,
  secret,
  emailAndPassword: { enabled: true, minPasswordLength: 8 },
  advanced: { database: { generateId: "uuid" } },
});

try {
  console.log("Setting up Better Auth tables...");
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();

  console.log("Setting up Aspire workspace tables...");
  await database.query(`
    create table if not exists aspire_profiles (
      user_id text primary key,
      profile jsonb not null,
      updated_at timestamptz not null default now()
    );

    create table if not exists aspire_roadmap_progress (
      user_id text not null,
      career text not null,
      completed jsonb not null default '[]'::jsonb,
      updated_at timestamptz not null default now(),
      primary key (user_id, career)
    );

    create table if not exists aspire_resume_analyses (
      id text primary key,
      user_id text not null,
      target_career text not null,
      resume_score integer not null,
      result jsonb not null,
      created_at timestamptz not null default now()
    );

    create index if not exists aspire_resume_user_created_idx
      on aspire_resume_analyses (user_id, created_at desc);

    create table if not exists aspire_application_boards (
      user_id text primary key,
      applications jsonb not null default '[]'::jsonb,
      updated_at timestamptz not null default now()
    );

    create table if not exists aspire_portfolio_boards (
      user_id text primary key,
      evidence jsonb not null default '[]'::jsonb,
      updated_at timestamptz not null default now()
    );
  `);

  console.log("Aspire database setup complete.");
} finally {
  await database.end();
}
