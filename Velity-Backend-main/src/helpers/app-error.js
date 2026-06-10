const { HTTP_STATUS } = require('../entities');

/**
 * Error operacional controlado. Permite asociar un status HTTP y un mensaje
 * seguro para el cliente sin exponer detalles internos (ej. errores de Supabase).
 */
class AppError extends Error {
  constructor(message, statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { AppError };
