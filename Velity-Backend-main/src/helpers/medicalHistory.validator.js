const { CATEGORY_VALUES } = require('../entities');
const { badRequest, isUUID } = require('./validation');

const validateFilters = (req, res, next) => {
  const { category, year, critical } = req.query;

  if (category !== undefined && !CATEGORY_VALUES.includes(category)) {
    return badRequest(res, `category inválida. Valores permitidos: ${CATEGORY_VALUES.join(', ')}`);
  }

  if (year !== undefined) {
    const n = Number(year);
    if (!Number.isInteger(n) || n < 1900 || n > 2100) {
      return badRequest(res, 'year debe ser un año válido entre 1900 y 2100');
    }
  }

  if (critical !== undefined && critical !== 'true' && critical !== 'false') {
    return badRequest(res, 'critical debe ser "true" o "false"');
  }

  req.validatedFilters = { category, year, critical };
  return next();
};

const validateRecordId = (req, res, next) => {
  const { recordId } = req.params;
  if (!isUUID(recordId || '')) {
    return badRequest(res, 'recordId no es un UUID válido');
  }
  return next();
};

module.exports = { validateFilters, validateRecordId };
