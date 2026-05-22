import postgres from 'postgres';

let sqlClient: ReturnType<typeof postgres> | null = null;

function getDatabaseUrl() {
  const databaseUrl = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('POSTGRES_URL atau DATABASE_URL belum diset.');
  }

  return databaseUrl;
}

export function getSql() {
  if (!sqlClient) {
    sqlClient = postgres(getDatabaseUrl(), { ssl: 'require' });
  }

  return sqlClient;
}
