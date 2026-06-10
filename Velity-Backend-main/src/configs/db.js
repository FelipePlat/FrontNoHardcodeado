const pg = require('pg');

const { Pool } = pg;

let pool = null;

function normalizeConnectionString(connectionString) {
  if (!connectionString) {
    return connectionString;
  }

  if (connectionString.includes(':6543/') && !connectionString.includes('pgbouncer=')) {
    const separator = connectionString.includes('?') ? '&' : '?';
    return `${connectionString}${separator}pgbouncer=true`;
  }

  return connectionString;
}

function getConnectionString() {
  const raw =
    process.env.DATABASE_URL?.trim() ||
    process.env.SUPABASE_DB_URL?.trim() ||
    null;

  return normalizeConnectionString(raw);
}

function dbConfigurado() {
  return Boolean(getConnectionString());
}

function getPool() {
  if (pool) {
    return pool;
  }

  const connectionString = getConnectionString();
  if (!connectionString) {
    return null;
  }

  pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
    max: 10,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
  });

  pool.on('error', (err) => {
    console.error('[Velity] Error inesperado en el pool de PostgreSQL:', err.message);
  });

  return pool;
}

async function query(text, params = []) {
  const p = getPool();
  if (!p) {
    throw new Error('DATABASE_URL no configurado en .env');
  }

  try {
    return await p.query(text, params);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Velity] SQL error:', err.message);
    }
    throw err;
  }
}

async function probarConexionDb() {
  if (!dbConfigurado()) {
    return { ok: false, error: 'DATABASE_URL no configurado' };
  }

  try {
    const { rows } = await query('SELECT 1 AS ok');
    return { ok: true, result: rows[0] };
  } catch (err) {
    let error = err.message;

    if (err.code === 'ENOTFOUND' && /db\.[^.]+\.supabase\.co/.test(getConnectionString() || '')) {
      error +=
        '. La conexión directa (db.[ref].supabase.co:5432) no resuelve en esta red. ' +
        'Usá el URI del pooler (puerto 6543) desde Supabase → Settings → Database → Connection string → Use connection pooling.';
    }

    return { ok: false, error };
  }
}

module.exports = {
  dbConfigurado,
  getPool,
  query,
  probarConexionDb,
};
