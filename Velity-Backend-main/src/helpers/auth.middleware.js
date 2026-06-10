const supabaseRepository = require('../repositories/supabase.repository');
const { HTTP_STATUS } = require('../entities');

const unauthorized = (res) =>
  res.status(HTTP_STATUS.UNAUTHORIZED).json({
    success: false,
    message: 'Unauthorized',
  });

/**
 * Middleware de autenticación.
 * Lee "Authorization: Bearer <JWT>", verifica la firma del token localmente
 * (Supabase JWT Secret) y adjunta req.user = { id }. Bloquea con 401 si el token es inválido.
 */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const match = /^Bearer\s+(\S+)/i.exec(header);

    if (!match) {
      return unauthorized(res);
    }

    const user = await supabaseRepository.getAuthUserByToken(match[1]);

    if (!user) {
      return unauthorized(res);
    }

    req.user = { id: user.id };
    return next();
  } catch (err) {
    return unauthorized(res);
  }
};

module.exports = { authenticate };
