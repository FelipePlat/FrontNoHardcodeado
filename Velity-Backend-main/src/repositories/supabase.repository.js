const { query, probarConexionDb } = require('../configs/db');
const { verifyAccessToken } = require('../helpers/jwt');

/**
 * Repositorio Supabase de bajo nivel.
 *
 * Centraliza accesos genéricos que no pertenecen a un dominio específico
 * (autenticación, healthcheck de DB, etc.).
 * Ningún service debe acceder a la base de datos directamente.
 */

const getAuthUserByToken = async (token) => verifyAccessToken(token);

const listUsers = async (limit = 5) => {
  const { rows } = await query(
    'SELECT id, nombre, apellido, email FROM usuarios ORDER BY nombre LIMIT $1',
    [limit],
  );

  return rows;
};

module.exports = {
  getAuthUserByToken,
  listUsers,
  probarConexionDb,
};
