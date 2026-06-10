const { query } = require('../configs/db');
const { AppError } = require('../helpers/app-error');
const { HTTP_STATUS } = require('../entities');

/**
 * Repositorio de "Historial Médico de un Familiar".
 *
 * Centraliza todas las queries necesarias para construir la respuesta del
 * endpoint `GET /api/family/:familyMemberId/medical-history`.
 *
 * Los services consumen estas funciones; nunca acceden a la base de datos
 * directamente.
 */

const HM_SELECT = `
  SELECT hm.id, hm.tipo, hm.titulo, hm.descripcion, hm.fecha, hm.diagnostico, hm.tratamiento,
         hm.es_critico, hm.paciente_id, hm.medico_id,
         hm.vacuna_dosis, hm.vacuna_nro_lote,
         l.id AS inst_id, l.nombre AS inst_nombre, l.tipo AS inst_tipo,
         v.id AS vac_id, v.nombre AS vac_nombre,
         ec.id AS est_id, ec.nombre AS est_nombre,
         m.id AS medico_row_id,
         esp.id AS esp_id, esp.nombre AS esp_nombre
  FROM historial_medico hm
  LEFT JOIN lugares l ON l.id = hm.id_institucion
  LEFT JOIN vacunas v ON v.id = hm.vacuna_id
  LEFT JOIN estudios_catalogo ec ON ec.id = hm.estudio_id
  LEFT JOIN medicos m ON m.id = hm.medico_id
  LEFT JOIN especialidades esp ON esp.id = m.especialidad_id
`;

const mapHistorialRow = (row) => ({
  id: row.id,
  tipo: row.tipo,
  titulo: row.titulo,
  descripcion: row.descripcion,
  fecha: row.fecha,
  diagnostico: row.diagnostico,
  tratamiento: row.tratamiento,
  es_critico: row.es_critico,
  paciente_id: row.paciente_id,
  medico_id: row.medico_id,
  vacuna_dosis: row.vacuna_dosis,
  vacuna_nro_lote: row.vacuna_nro_lote,
  institucion: row.inst_id
    ? { id: row.inst_id, nombre: row.inst_nombre, tipo: row.inst_tipo }
    : null,
  vacuna: row.vac_id ? { id: row.vac_id, nombre: row.vac_nombre } : null,
  estudio: row.est_id ? { id: row.est_id, nombre: row.est_nombre } : null,
  medico: row.medico_row_id
    ? {
        id: row.medico_row_id,
        especialidad: row.esp_id ? { id: row.esp_id, nombre: row.esp_nombre } : null,
      }
    : null,
  attachments: [],
});

const attachAdjuntos = async (rows) => {
  if (rows.length === 0) {
    return rows;
  }

  const ids = rows.map((row) => row.id);
  const { rows: adjuntos } = await query(
    `SELECT id, historial_id, nombre_archivo, tipo_archivo, tamanio_bytes, storage_path
     FROM adjuntos_medicos
     WHERE historial_id = ANY($1::uuid[])`,
    [ids],
  );

  const byHistorial = new Map();
  adjuntos.forEach((att) => {
    const list = byHistorial.get(att.historial_id) || [];
    list.push({
      id: att.id,
      nombre_archivo: att.nombre_archivo,
      tipo_archivo: att.tipo_archivo,
      tamanio_bytes: att.tamanio_bytes,
      storage_path: att.storage_path,
    });
    byHistorial.set(att.historial_id, list);
  });

  return rows.map((row) => ({
    ...row,
    attachments: byHistorial.get(row.id) || [],
  }));
};

const findUserBasicById = async (userId) => {
  try {
    const { rows } = await query(
      'SELECT id, nombre, apellido, foto_url FROM usuarios WHERE id = $1 LIMIT 1',
      [userId],
    );
    return rows[0] || null;
  } catch (_err) {
    throw new AppError(
      'No se pudo obtener la información del familiar',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

const findFamilyRelation = async (propietarioId, familiarId) => {
  try {
    const { rows } = await query(
      `SELECT id
       FROM familiares
       WHERE propietario_id = $1 AND familiar_id = $2
       LIMIT 1`,
      [propietarioId, familiarId],
    );
    return rows[0] || null;
  } catch (_err) {
    throw new AppError(
      'No se pudo verificar el acceso al familiar',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

const findHistorialByPacienteId = async (pacienteId) => {
  try {
    const { rows } = await query(
      `${HM_SELECT}
       WHERE hm.paciente_id = $1
       ORDER BY hm.fecha DESC`,
      [pacienteId],
    );

    const mapped = rows.map(mapHistorialRow);
    return attachAdjuntos(mapped);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Velity] findHistorialByPacienteId:', err.message);
    }
    throw new AppError(
      'No se pudo obtener el historial médico del familiar',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

module.exports = {
  findUserBasicById,
  findFamilyRelation,
  findHistorialByPacienteId,
};
