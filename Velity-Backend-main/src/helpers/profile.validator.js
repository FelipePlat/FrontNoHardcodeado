const { HTTP_STATUS, SEXO_VALUES } = require('../entities');
const { isNonEmptyString, isProvided } = require('./validation');

/**
 * Valida y sanitiza el body de PUT /api/profile/me.
 * Solo deja pasar campos permitidos en req.validatedBody.
 */
const validateUpdateProfile = (req, res, next) => {
  const body = req.body || {};
  const errors = [];

  if (!isNonEmptyString(body.nombre)) {
    errors.push('El nombre es obligatorio');
  }
  if (!isNonEmptyString(body.apellido)) {
    errors.push('El apellido es obligatorio');
  }

  if (isProvided(body.telefono)) {
    const phone = String(body.telefono).trim();
    if (phone.length < 6 || phone.length > 20) {
      errors.push('El teléfono debe tener entre 6 y 20 caracteres');
    }
  }

  if (isProvided(body.sexo) && !SEXO_VALUES.includes(body.sexo)) {
    errors.push(`El sexo debe ser uno de: ${SEXO_VALUES.join(', ')}`);
  }

  if (body.peso_kg !== undefined && body.peso_kg !== null) {
    const peso = Number(body.peso_kg);
    if (Number.isNaN(peso) || peso <= 0) {
      errors.push('El peso debe ser un número mayor a 0');
    }
  }

  if (body.altura_cm !== undefined && body.altura_cm !== null) {
    const altura = Number(body.altura_cm);
    if (Number.isNaN(altura) || altura <= 0) {
      errors.push('La altura debe ser un número mayor a 0');
    }
  }

  if (isProvided(body.foto_url) && typeof body.foto_url !== 'string') {
    errors.push('La foto debe ser una URL válida');
  }

  if (errors.length > 0) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: errors.join('. '),
    });
  }

  const sanitized = {
    nombre: body.nombre.trim(),
    apellido: body.apellido.trim(),
  };
  if (body.telefono !== undefined) {
    sanitized.telefono = body.telefono === '' ? null : String(body.telefono).trim();
  }
  if (isProvided(body.sexo)) {
    sanitized.sexo = body.sexo;
  }
  if (body.peso_kg !== undefined && body.peso_kg !== null) {
    sanitized.peso_kg = Number(body.peso_kg);
  }
  if (body.altura_cm !== undefined && body.altura_cm !== null) {
    sanitized.altura_cm = Number(body.altura_cm);
  }
  if (body.foto_url !== undefined) {
    sanitized.foto_url = body.foto_url === '' ? null : body.foto_url;
  }

  req.validatedBody = sanitized;
  return next();
};

module.exports = { validateUpdateProfile };
