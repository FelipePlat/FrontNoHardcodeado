const { query } = require('../configs/db');
const { AppError } = require('../helpers/app-error');
const { HTTP_STATUS } = require('../entities');

/**
 * Repositorio de Turnos.
 *
 * Centraliza todas las queries a `turnos` y a las tablas relacionadas usadas
 * para validar referencias (médicos, especialidades, lugares) y para resolver
 * el nombre del médico (lookup en `usuarios`, ya que `medicos.id` es FK a
 * `usuarios.id`). Ningún service accede a la base de datos directamente.
 */

const mapTurnoListRow = (row) => ({
  id: row.id,
  fecha_hora: row.fecha_hora,
  estado: row.estado,
  centro_nombre: row.centro_nombre,
  medico_id: row.medico_id,
  especialidad: row.esp_id ? { id: row.esp_id, nombre: row.esp_nombre } : null,
  lugar: row.lugar_row_id ? { id: row.lugar_row_id, nombre: row.lugar_nombre } : null,
});

const mapTurnoDetailRow = (row) => ({
  id: row.id,
  paciente_id: row.paciente_id,
  fecha_hora: row.fecha_hora,
  duracion_minutos: row.duracion_minutos,
  tipo: row.tipo,
  estado: row.estado,
  centro_nombre: row.centro_nombre,
  centro_direccion: row.centro_direccion,
  link_videollamada: row.link_videollamada,
  indicaciones_previas: row.indicaciones_previas,
  costo: row.costo,
  cubierto_os: row.cubierto_os,
  notas: row.notas,
  medico_id: row.medico_id,
  especialidad_id: row.especialidad_id,
  lugar_id: row.lugar_id,
  especialidad: row.esp_id ? { id: row.esp_id, nombre: row.esp_nombre } : null,
  lugar: row.lugar_row_id
    ? { id: row.lugar_row_id, nombre: row.lugar_nombre, direccion: row.lugar_direccion }
    : null,
});

const TURNO_LIST_FROM = `
  FROM turnos t
  LEFT JOIN especialidades esp ON esp.id = t.especialidad_id
  LEFT JOIN lugares l ON l.id = t.lugar_id
`;

const TURNO_DETAIL_SELECT = `
  SELECT t.id, t.paciente_id, t.fecha_hora, t.duracion_minutos, t.tipo, t.estado,
         t.centro_nombre, t.centro_direccion, t.link_videollamada, t.indicaciones_previas,
         t.costo, t.cubierto_os, t.notas, t.medico_id, t.especialidad_id, t.lugar_id,
         esp.id AS esp_id, esp.nombre AS esp_nombre,
         l.id AS lugar_row_id, l.nombre AS lugar_nombre, l.direccion AS lugar_direccion
`;

/* ---------- Lookups de validación ---------- */

const findSpecialtyById = async (specialtyId) => {
  try {
    const { rows } = await query(
      'SELECT id, activo FROM especialidades WHERE id = $1 LIMIT 1',
      [specialtyId],
    );
    return rows[0] || null;
  } catch (_err) {
    throw new AppError('No se pudo verificar la especialidad', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

const findDoctorById = async (doctorId) => {
  try {
    const { rows } = await query('SELECT id FROM medicos WHERE id = $1 LIMIT 1', [doctorId]);
    return rows[0] || null;
  } catch (_err) {
    throw new AppError('No se pudo verificar el médico', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

const findLocationById = async (locationId) => {
  try {
    const { rows } = await query(
      'SELECT id, activo FROM lugares WHERE id = $1 LIMIT 1',
      [locationId],
    );
    return rows[0] || null;
  } catch (_err) {
    throw new AppError('No se pudo verificar el lugar', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/* ---------- Queries principales ---------- */

const findCalendarDatesByUserAndRange = async (userId, fromIso, toIso) => {
  try {
    const { rows } = await query(
      `SELECT fecha_hora
       FROM turnos
       WHERE paciente_id = $1 AND fecha_hora >= $2 AND fecha_hora < $3`,
      [userId, fromIso, toIso],
    );
    return rows;
  } catch (_err) {
    throw new AppError(
      'No se pudo obtener el calendario de turnos',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

const findAppointmentsByUserAndRange = async (userId, fromIso, toIso) => {
  try {
    const { rows } = await query(
      `SELECT t.id, t.fecha_hora, t.estado, t.centro_nombre, t.medico_id,
              esp.id AS esp_id, esp.nombre AS esp_nombre,
              l.id AS lugar_row_id, l.nombre AS lugar_nombre
       ${TURNO_LIST_FROM}
       WHERE t.paciente_id = $1 AND t.fecha_hora >= $2 AND t.fecha_hora < $3
       ORDER BY t.fecha_hora ASC`,
      [userId, fromIso, toIso],
    );
    return rows.map(mapTurnoListRow);
  } catch (_err) {
    throw new AppError(
      'No se pudieron obtener los turnos del día',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

const findAppointmentById = async (appointmentId) => {
  try {
    const { rows } = await query(
      `${TURNO_DETAIL_SELECT}
       ${TURNO_LIST_FROM}
       WHERE t.id = $1
       LIMIT 1`,
      [appointmentId],
    );
    return rows[0] ? mapTurnoDetailRow(rows[0]) : null;
  } catch (_err) {
    throw new AppError('No se pudo obtener el turno', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

/* ---------- Mutations ---------- */

const insertAppointment = async (row) => {
  const keys = Object.keys(row);
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');

  try {
    const { rows: inserted } = await query(
      `INSERT INTO turnos (${keys.join(', ')}) VALUES (${placeholders}) RETURNING id`,
      keys.map((key) => row[key]),
    );

    if (!inserted[0]) {
      throw new AppError('No se pudo crear el turno', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return inserted[0].id;
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    throw new AppError('No se pudo crear el turno', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

const updateAppointmentById = async (appointmentId, payload) => {
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    return;
  }

  const setClauses = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
  const values = [appointmentId, ...keys.map((key) => payload[key])];

  try {
    await query(`UPDATE turnos SET ${setClauses} WHERE id = $1`, values);
  } catch (_err) {
    throw new AppError('No se pudo actualizar el turno', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

const deleteAppointmentById = async (appointmentId) => {
  try {
    await query('DELETE FROM turnos WHERE id = $1', [appointmentId]);
  } catch (_err) {
    throw new AppError('No se pudo eliminar el turno', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  findSpecialtyById,
  findDoctorById,
  findLocationById,
  findCalendarDatesByUserAndRange,
  findAppointmentsByUserAndRange,
  findAppointmentById,
  insertAppointment,
  updateAppointmentById,
  deleteAppointmentById,
};
