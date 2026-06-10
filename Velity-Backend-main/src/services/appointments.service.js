const appointmentsRepository = require('../repositories/appointments.repository');
const usersRepository = require('../repositories/users.repository');
const { AppError } = require('../helpers/app-error');
const {
  buildDayRange,
  buildMonthRange,
  extractArgentinaDayOfMonth,
} = require('../helpers/date-range');
const { HTTP_STATUS, APPOINTMENT_DEFAULT_STATUS } = require('../entities');
const { toAppointmentDayDTO, toAppointmentDetailDTO } = require('../entities/appointment.entity');

/**
 * Mapea claves del payload validado (camelCase) a las columnas reales de la
 * tabla `turnos` (snake_case). Solo se incluyen claves que efectivamente
 * vengan en el payload — esto permite reutilizarlo tanto en INSERT como en
 * UPDATE parcial.
 */
const FIELD_MAP = {
  fechaHora: 'fecha_hora',
  medicoId: 'medico_id',
  especialidadId: 'especialidad_id',
  lugarId: 'lugar_id',
  centroNombre: 'centro_nombre',
  centroDireccion: 'centro_direccion',
  duracionMinutos: 'duracion_minutos',
  tipo: 'tipo',
  linkVideollamada: 'link_videollamada',
  indicacionesPrevias: 'indicaciones_previas',
  costo: 'costo',
  cubiertoOs: 'cubierto_os',
  notas: 'notas',
};

const toRowPayload = (validatedBody) => {
  const row = {};
  Object.entries(FIELD_MAP).forEach(([camelKey, dbKey]) => {
    if (Object.prototype.hasOwnProperty.call(validatedBody, camelKey)) {
      row[dbKey] = validatedBody[camelKey];
    }
  });
  return row;
};

/* ---------- Validaciones de dominio ---------- */

const ensureFutureDateTime = (isoString) => {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    throw new AppError('fechaHora no es una fecha válida', HTTP_STATUS.BAD_REQUEST);
  }
  if (date.getTime() <= Date.now()) {
    throw new AppError('fechaHora debe ser una fecha futura', HTTP_STATUS.BAD_REQUEST);
  }
};

/**
 * Valida que las entidades referenciadas existan en la base. Las tres
 * referencias son opcionales en el schema; aquí solo se valida que, cuando
 * se envíen, apunten a registros reales.
 */
const ensureReferencesExist = async (validatedBody) => {
  const checks = [];

  if (validatedBody.especialidadId) {
    checks.push(
      appointmentsRepository.findSpecialtyById(validatedBody.especialidadId).then((row) => {
        if (!row) {
          throw new AppError('La especialidad indicada no existe', HTTP_STATUS.BAD_REQUEST);
        }
      }),
    );
  }

  if (validatedBody.medicoId) {
    checks.push(
      appointmentsRepository.findDoctorById(validatedBody.medicoId).then((row) => {
        if (!row) {
          throw new AppError('El médico indicado no existe', HTTP_STATUS.BAD_REQUEST);
        }
      }),
    );
  }

  if (validatedBody.lugarId) {
    checks.push(
      appointmentsRepository.findLocationById(validatedBody.lugarId).then((row) => {
        if (!row) {
          throw new AppError('El lugar indicado no existe', HTTP_STATUS.BAD_REQUEST);
        }
      }),
    );
  }

  if (checks.length > 0) {
    await Promise.all(checks);
  }
};

/**
 * Función reutilizable para verificar ownership.
 *
 * 1. Consulta el repositorio.
 * 2. Si no existe → 404.
 * 3. Si pertenece a otro usuario → 403.
 * 4. Devuelve la fila completa para evitar refetchs innecesarios.
 */
const validateAppointmentOwnership = async (userId, appointmentId) => {
  const appointment = await appointmentsRepository.findAppointmentById(appointmentId);

  if (!appointment) {
    throw new AppError('Turno no encontrado', HTTP_STATUS.NOT_FOUND);
  }
  if (appointment.paciente_id !== userId) {
    throw new AppError('Acceso denegado', HTTP_STATUS.FORBIDDEN);
  }
  return appointment;
};

/* ---------- Helpers de mapeo ---------- */

const mapDayRowsToDTOs = async (rows) => {
  const usuariosMap = await usersRepository.findDoctorsUsersByMedicoIds(rows);
  return rows.map((row) => toAppointmentDayDTO(row, usuariosMap));
};

const mapDetailRowToDTO = async (row) => {
  const usuariosMap = await usersRepository.findDoctorsUsersByMedicoIds([row]);
  return toAppointmentDetailDTO(row, usuariosMap);
};

/* ---------- Casos de uso ---------- */

const getCalendar = async (userId, month, year) => {
  const { from, to } = buildMonthRange(month, year);
  const rows = await appointmentsRepository.findCalendarDatesByUserAndRange(userId, from, to);

  const daySet = new Set();
  rows.forEach((row) => {
    const day = extractArgentinaDayOfMonth(row.fecha_hora);
    if (day !== null) {
      daySet.add(day);
    }
  });

  const daysWithAppointments = [...daySet].sort((a, b) => a - b);

  return {
    month,
    year,
    daysWithAppointments,
    totalAppointments: rows.length,
  };
};

const getAppointmentsByDay = async (userId, dateStr) => {
  const { from, to } = buildDayRange(dateStr);
  const rows = await appointmentsRepository.findAppointmentsByUserAndRange(userId, from, to);
  return mapDayRowsToDTOs(rows);
};

const getAppointmentDetail = async (userId, appointmentId) => {
  const row = await validateAppointmentOwnership(userId, appointmentId);
  return mapDetailRowToDTO(row);
};

const createAppointment = async (userId, validatedBody) => {
  ensureFutureDateTime(validatedBody.fechaHora);
  await ensureReferencesExist(validatedBody);

  const row = toRowPayload(validatedBody);
  row.paciente_id = userId;
  row.estado = APPOINTMENT_DEFAULT_STATUS;

  const newId = await appointmentsRepository.insertAppointment(row);
  const created = await appointmentsRepository.findAppointmentById(newId);

  if (!created) {
    throw new AppError(
      'No se pudo recuperar el turno recién creado',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
  return mapDetailRowToDTO(created);
};

const updateAppointment = async (userId, appointmentId, validatedBody) => {
  await validateAppointmentOwnership(userId, appointmentId);

  if (Object.prototype.hasOwnProperty.call(validatedBody, 'fechaHora')) {
    ensureFutureDateTime(validatedBody.fechaHora);
  }
  await ensureReferencesExist(validatedBody);

  const row = toRowPayload(validatedBody);

  if (Object.keys(row).length === 0) {
    throw new AppError('No hay campos válidos para actualizar', HTTP_STATUS.BAD_REQUEST);
  }

  await appointmentsRepository.updateAppointmentById(appointmentId, row);
  const updated = await appointmentsRepository.findAppointmentById(appointmentId);

  if (!updated) {
    throw new AppError(
      'No se pudo recuperar el turno actualizado',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
  return mapDetailRowToDTO(updated);
};

const deleteAppointment = async (userId, appointmentId) => {
  await validateAppointmentOwnership(userId, appointmentId);
  await appointmentsRepository.deleteAppointmentById(appointmentId);
};

module.exports = {
  validateAppointmentOwnership,
  getCalendar,
  getAppointmentsByDay,
  getAppointmentDetail,
  createAppointment,
  updateAppointment,
  deleteAppointment,
};
