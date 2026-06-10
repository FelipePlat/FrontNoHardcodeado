const { query } = require('../configs/db');
const { AppError } = require('../helpers/app-error');
const { HTTP_STATUS } = require('../entities');

/**
 * Repositorio de Historial Médico.
 *
 * Centraliza todas las queries de `historial_medico` y la resolución de
 * datos de médicos asociados (lookup en `usuarios`). Los services consumen
 * estas funciones y nunca acceden a la base de datos directamente.
 */

const HM_SELECT = `
  SELECT hm.id, hm.tipo, hm.titulo, hm.descripcion, hm.fecha, hm.diagnostico, hm.tratamiento,
         hm.es_critico, hm.paciente_id, hm.medico_id,
         hm.vacuna_dosis, hm.vacuna_nro_lote, hm.vacuna_vencimiento, hm.vacuna_centro,
         l.id AS inst_id, l.nombre AS inst_nombre,
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
  vacuna_vencimiento: row.vacuna_vencimiento,
  vacuna_centro: row.vacuna_centro,
  institucion: row.inst_id ? { id: row.inst_id, nombre: row.inst_nombre } : null,
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
    `SELECT id, historial_id, nombre_archivo, tipo_archivo, storage_path
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
      storage_path: att.storage_path,
    });
    byHistorial.set(att.historial_id, list);
  });

  return rows.map((row) => ({
    ...row,
    attachments: byHistorial.get(row.id) || [],
  }));
};

const buildHistorialWhere = (userId, filters = {}) => {
  const conditions = ['hm.paciente_id = $1'];
  const params = [userId];
  let paramIndex = 2;

  if (filters.tipo) {
    conditions.push(`hm.tipo = $${paramIndex}`);
    params.push(filters.tipo);
    paramIndex += 1;
  }

  if (filters.yearFrom) {
    conditions.push(`hm.fecha >= $${paramIndex}`);
    params.push(filters.yearFrom);
    paramIndex += 1;
  }

  if (filters.yearTo) {
    conditions.push(`hm.fecha <= $${paramIndex}`);
    params.push(filters.yearTo);
    paramIndex += 1;
  }

  if (filters.es_critico !== undefined) {
    conditions.push(`hm.es_critico = $${paramIndex}`);
    params.push(filters.es_critico);
    paramIndex += 1;
  }

  return {
    whereClause: conditions.join(' AND '),
    params,
  };
};

const findHistorialBaseByUserId = async (userId, filters = {}) => {
  const { whereClause, params } = buildHistorialWhere(userId, filters);

  try {
    const { rows } = await query(
      `${HM_SELECT}
       WHERE ${whereClause}
       ORDER BY hm.fecha DESC`,
      params,
    );

    const mapped = rows.map(mapHistorialRow);
    return attachAdjuntos(mapped);
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Velity] findHistorialBaseByUserId:', err.message);
    }
    throw new AppError('No se pudo obtener el historial médico', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

const findChronicConditionsByUserId = async (userId) => {
  try {
    const { rows } = await query(
      `SELECT id, titulo, descripcion, fecha, tipo, es_critico
       FROM historial_medico
       WHERE paciente_id = $1
         AND tipo IN ('enfermedad', 'diagnostico')
         AND es_critico = true
       ORDER BY fecha DESC`,
      [userId],
    );
    return rows;
  } catch (_err) {
    throw new AppError(
      'No se pudieron obtener las enfermedades crónicas',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

const findRecordById = async (recordId) => {
  try {
    const { rows } = await query(
      `${HM_SELECT}
       WHERE hm.id = $1
       LIMIT 1`,
      [recordId],
    );

    if (!rows[0]) {
      return null;
    }

    const [withAttachments] = await attachAdjuntos([mapHistorialRow(rows[0])]);
    return withAttachments;
  } catch (_err) {
    throw new AppError('No se pudo obtener el registro', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  findHistorialBaseByUserId,
  findChronicConditionsByUserId,
  findRecordById,
};
