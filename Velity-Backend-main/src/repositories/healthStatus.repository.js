const { query } = require('../configs/db');
const { AppError } = require('../helpers/app-error');
const { HTTP_STATUS } = require('../entities');

/**
 * Queries compartidas para calcular el estado de salud de un paciente
 * (medicación activa vigente + antecedentes con patología crónica).
 */

const findActiveMedicationsByUserId = async (userId) => {
  const today = new Date().toISOString().slice(0, 10);

  try {
    const { rows } = await query(
      `SELECT id
       FROM medicamentos_paciente
       WHERE paciente_id = $1
         AND activo = true
         AND (fin_en IS NULL OR fin_en >= $2)`,
      [userId, today],
    );

    return rows;
  } catch (_err) {
    throw new AppError(
      'No se pudo obtener la medicación activa',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

const findChronicConditionInputsByUserId = async (userId) => {
  try {
    const { rows } = await query(
      `SELECT ap.id, p.id AS patologia_id, p.es_cronica
       FROM antecedentes_paciente ap
       LEFT JOIN patologias p ON p.id = ap.enfermedad_id
       WHERE ap.paciente_id = $1`,
      [userId],
    );

    return rows.map((row) => ({
      id: row.id,
      patologia: row.patologia_id ? { id: row.patologia_id, es_cronica: row.es_cronica } : null,
    }));
  } catch (_err) {
    throw new AppError(
      'No se pudieron obtener los antecedentes para el estado de salud',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

const findHealthStatusInputsByUserId = async (userId) => {
  const [activeMedications, conditions] = await Promise.all([
    findActiveMedicationsByUserId(userId),
    findChronicConditionInputsByUserId(userId),
  ]);

  return {
    activeMedications,
    conditions,
  };
};

module.exports = {
  findActiveMedicationsByUserId,
  findChronicConditionInputsByUserId,
  findHealthStatusInputsByUserId,
};
