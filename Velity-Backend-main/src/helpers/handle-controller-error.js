const { HTTP_STATUS } = require('../entities');
const { AppError } = require('./app-error');

/**
 * Traduce cualquier error en una respuesta HTTP consistente.
 * Solo expone el mensaje cuando el error es operacional (AppError).
 * Nunca filtra detalles internos de Supabase u otros servicios.
 *
 * @param {import('express').Response} res
 * @param {Error} error
 */
const handleControllerError = (res, error) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  // eslint-disable-next-line no-console
  console.error('[Velity] Error no controlado:', error);

  return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
    success: false,
    message: 'Error interno del servidor',
  });
};

module.exports = { handleControllerError };
