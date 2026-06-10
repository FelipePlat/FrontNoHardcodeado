const { createClient } = require('@supabase/supabase-js');
const { env } = require('./env');

let supabase = null;

function getSupabase() {
  if (supabase) {
    return supabase;
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'Faltan variables de entorno de Supabase: SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY',
    );
  }

  supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabase;
}

module.exports = { getSupabase };
