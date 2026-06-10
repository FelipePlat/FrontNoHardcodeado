const { APPOINTMENT_TYPES } = require('../entities');
const { isValidYYYYMMDD } = require('./date-range');
const { badRequest, isUUID, isProvided, isNonEmptyString } = require('./validation');

const bad = badRequest;

const isValidISODateTime = (value) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    return false;
  }
  const date = new Date(value);
  return !Number.isNaN(date.getTime());
};

const validateAppointmentId = (req, res, next) => {
  const { appointmentId } = req.params;
  if (!isUUID(appointmentId)) {
    return bad(res, 'appointmentId no es un UUID válido');
  }
  return next();
};

const validateDateParam = (req, res, next) => {
  const { date } = req.params;
  if (!isValidYYYYMMDD(date)) {
    return bad(res, 'date debe tener formato YYYY-MM-DD válido');
  }
  return next();
};

const validateCalendarQuery = (req, res, next) => {
  const { month, year } = req.query;

  if (!isProvided(month) || !isProvided(year)) {
    return bad(res, 'month y year son obligatorios');
  }

  const monthNum = Number(month);
  const yearNum = Number(year);

  if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
    return bad(res, 'month debe ser un entero entre 1 y 12');
  }
  if (!Number.isInteger(yearNum) || yearNum < 1900 || yearNum > 2100) {
    return bad(res, 'year debe ser un entero entre 1900 y 2100');
  }

  req.validatedQuery = { month: monthNum, year: yearNum };
  return next();
};

/**
 * Construye el payload sanitizado a partir del body, validando los campos
 * provistos. `requireFechaHora` controla si la fecha es obligatoria (true al
 * crear, false al editar).
 *
 * Devuelve `{ payload, errors }`.
 */
const buildAppointmentPayload = (body, { requireFechaHora }) => {
  const errors = [];
  const payload = {};

  if (isProvided(body.fechaHora)) {
    if (!isValidISODateTime(body.fechaHora)) {
      errors.push('fechaHora debe ser una fecha-hora ISO válida');
    } else {
      payload.fechaHora = body.fechaHora;
    }
  } else if (requireFechaHora) {
    errors.push('fechaHora es obligatoria');
  }

  if (isProvided(body.medicoId)) {
    if (!isUUID(body.medicoId)) {
      errors.push('medicoId no es un UUID válido');
    } else {
      payload.medicoId = body.medicoId;
    }
  } else if (body.medicoId === null) {
    payload.medicoId = null;
  }

  if (isProvided(body.especialidadId)) {
    if (!isUUID(body.especialidadId)) {
      errors.push('especialidadId no es un UUID válido');
    } else {
      payload.especialidadId = body.especialidadId;
    }
  } else if (body.especialidadId === null) {
    payload.especialidadId = null;
  }

  if (isProvided(body.lugarId)) {
    if (!isUUID(body.lugarId)) {
      errors.push('lugarId no es un UUID válido');
    } else {
      payload.lugarId = body.lugarId;
    }
  } else if (body.lugarId === null) {
    payload.lugarId = null;
  }

  if (isProvided(body.centroNombre)) {
    if (!isNonEmptyString(body.centroNombre)) {
      errors.push('centroNombre debe ser un texto no vacío');
    } else {
      payload.centroNombre = body.centroNombre.trim();
    }
  } else if (body.centroNombre === null || body.centroNombre === '') {
    payload.centroNombre = null;
  }

  if (isProvided(body.centroDireccion)) {
    if (!isNonEmptyString(body.centroDireccion)) {
      errors.push('centroDireccion debe ser un texto no vacío');
    } else {
      payload.centroDireccion = body.centroDireccion.trim();
    }
  } else if (body.centroDireccion === null || body.centroDireccion === '') {
    payload.centroDireccion = null;
  }

  if (body.duracionMinutos !== undefined && body.duracionMinutos !== null) {
    const dur = Number(body.duracionMinutos);
    if (!Number.isInteger(dur) || dur <= 0) {
      errors.push('duracionMinutos debe ser un entero mayor a 0');
    } else {
      payload.duracionMinutos = dur;
    }
  }

  if (isProvided(body.tipo)) {
    if (!APPOINTMENT_TYPES.includes(body.tipo)) {
      errors.push(`tipo debe ser uno de: ${APPOINTMENT_TYPES.join(', ')}`);
    } else {
      payload.tipo = body.tipo;
    }
  }

  if (isProvided(body.linkVideollamada)) {
    if (typeof body.linkVideollamada !== 'string') {
      errors.push('linkVideollamada debe ser una URL válida');
    } else {
      payload.linkVideollamada = body.linkVideollamada.trim();
    }
  } else if (body.linkVideollamada === null || body.linkVideollamada === '') {
    payload.linkVideollamada = null;
  }

  if (isProvided(body.indicacionesPrevias)) {
    if (typeof body.indicacionesPrevias !== 'string') {
      errors.push('indicacionesPrevias debe ser un texto');
    } else {
      payload.indicacionesPrevias = body.indicacionesPrevias.trim();
    }
  } else if (body.indicacionesPrevias === null || body.indicacionesPrevias === '') {
    payload.indicacionesPrevias = null;
  }

  if (body.costo !== undefined && body.costo !== null) {
    const costo = Number(body.costo);
    if (Number.isNaN(costo) || costo < 0) {
      errors.push('costo debe ser un número mayor o igual a 0');
    } else {
      payload.costo = costo;
    }
  } else if (body.costo === null) {
    payload.costo = null;
  }

  if (body.cubiertoOs !== undefined && body.cubiertoOs !== null) {
    if (typeof body.cubiertoOs !== 'boolean') {
      errors.push('cubiertoOs debe ser un booleano');
    } else {
      payload.cubiertoOs = body.cubiertoOs;
    }
  }

  if (isProvided(body.notas)) {
    if (typeof body.notas !== 'string') {
      errors.push('notas debe ser un texto');
    } else {
      payload.notas = body.notas.trim();
    }
  } else if (body.notas === null || body.notas === '') {
    payload.notas = null;
  }

  return { payload, errors };
};

const validateCreateAppointment = (req, res, next) => {
  const body = req.body || {};
  const { payload, errors } = buildAppointmentPayload(body, {
    requireFechaHora: true,
  });

  if (errors.length > 0) {
    return bad(res, errors.join('. '));
  }

  req.validatedBody = payload;
  return next();
};

const validateUpdateAppointment = (req, res, next) => {
  const body = req.body || {};
  const { payload, errors } = buildAppointmentPayload(body, {
    requireFechaHora: false,
  });

  if (errors.length > 0) {
    return bad(res, errors.join('. '));
  }

  if (Object.keys(payload).length === 0) {
    return bad(res, 'No hay campos válidos para actualizar');
  }

  req.validatedBody = payload;
  return next();
};

module.exports = {
  validateAppointmentId,
  validateDateParam,
  validateCalendarQuery,
  validateCreateAppointment,
  validateUpdateAppointment,
};
