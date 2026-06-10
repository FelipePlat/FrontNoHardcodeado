const { query } = require('../configs/db');
const { AppError } = require('../helpers/app-error');
const { HTTP_STATUS } = require('../entities');

/**
 * Repositorio de Perfil.
 *
 * Toda interacción con la base de datos relacionada al perfil del usuario
 * autenticado (datos básicos, alergias, antecedentes e historial crítico) vive aquí.
 * Los services consumen únicamente estas funciones; nunca acceden a la DB
 * directamente.
 */

const mapUserRow = (row) => {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    nombre: row.nombre,
    apellido: row.apellido,
    email: row.email,
    telefono: row.telefono,
    foto_url: row.foto_url,
    fecha_nacimiento: row.fecha_nacimiento,
    sexo: row.sexo,
    grupo_sanguineo: row.grupo_sanguineo,
    peso_kg: row.peso_kg,
    altura_cm: row.altura_cm,
    obra_social_id: row.obra_social_id,
    obra_social: row.os_id ? { id: row.os_id, nombre: row.os_nombre } : null,
  };
};

const findUserById = async (userId) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.telefono, u.foto_url,
              u.fecha_nacimiento, u.sexo, u.grupo_sanguineo, u.peso_kg, u.altura_cm,
              u.obra_social_id, os.id AS os_id, os.nombre AS os_nombre
       FROM usuarios u
       LEFT JOIN obras_sociales os ON os.id = u.obra_social_id
       WHERE u.id = $1
       LIMIT 1`,
      [userId],
    );

    return mapUserRow(rows[0] || null);
  } catch (_err) {
    throw new AppError(
      'No se pudo obtener la información del usuario',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

const findAllergiesByUserId = async (userId) => {
  try {
    const { rows } = await query(
      `SELECT ap.id, ap.nombre_libre,
              a.id AS alergia_id, a.descripcion AS alergia_descripcion
       FROM alergias_paciente ap
       LEFT JOIN alergias a ON a.id = ap.alergia_id
       WHERE ap.paciente_id = $1`,
      [userId],
    );

    return rows.map((row) => ({
      id: row.id,
      nombre_libre: row.nombre_libre,
      alergia: row.alergia_id ? { id: row.alergia_id, descripcion: row.alergia_descripcion } : null,
    }));
  } catch (_err) {
    throw new AppError('No se pudieron obtener las alergias', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

const findConditionsByUserId = async (userId) => {
  try {
    const { rows: antecedentes } = await query(
      `SELECT id, nombre_libre, tipo, enfermedad_id
       FROM antecedentes_paciente
       WHERE paciente_id = $1`,
      [userId],
    );

    const enfermedadIds = [
      ...new Set(antecedentes.map((row) => row.enfermedad_id).filter(Boolean)),
    ];

    const patologiasMap = new Map();
    if (enfermedadIds.length > 0) {
      const { rows: patologias } = await query(
        `SELECT id, nombre, es_cronica
         FROM patologias
         WHERE id = ANY($1::uuid[])`,
        [enfermedadIds],
      );

      patologias.forEach((patologia) => {
        patologiasMap.set(patologia.id, patologia);
      });
    }

    return antecedentes.map((row) => {
      const patologia = row.enfermedad_id ? patologiasMap.get(row.enfermedad_id) : null;

      return {
        id: row.id,
        nombre_libre: row.nombre_libre,
        tipo: row.tipo,
        patologia: patologia
          ? {
              id: row.enfermedad_id,
              nombre: patologia.nombre,
              es_cronica: patologia.es_cronica,
            }
          : null,
      };
    });
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[Velity] findConditionsByUserId:', err.message);
    }
    throw new AppError(
      'No se pudieron obtener las condiciones médicas',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

const findCriticalHistoryByUserId = async (userId) => {
  try {
    const { rows } = await query(
      `SELECT id, titulo, descripcion, fecha, diagnostico, tratamiento
       FROM historial_medico
       WHERE paciente_id = $1 AND es_critico = true
       ORDER BY fecha DESC`,
      [userId],
    );

    return rows;
  } catch (_err) {
    throw new AppError(
      'No se pudo obtener el historial crítico',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

const updateUserById = async (userId, payload) => {
  const keys = Object.keys(payload);
  if (keys.length === 0) {
    return;
  }

  const setClauses = keys.map((key, index) => `${key} = $${index + 2}`).join(', ');
  const values = [userId, ...keys.map((key) => payload[key])];

  try {
    await query(`UPDATE usuarios SET ${setClauses} WHERE id = $1`, values);
  } catch (_err) {
    throw new AppError('No se pudo actualizar el perfil', HTTP_STATUS.INTERNAL_SERVER_ERROR);
  }
};

module.exports = {
  findUserById,
  findAllergiesByUserId,
  findConditionsByUserId,
  findCriticalHistoryByUserId,
  updateUserById,
};
