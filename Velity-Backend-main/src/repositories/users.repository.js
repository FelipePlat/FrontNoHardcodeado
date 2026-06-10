const { query } = require('../configs/db');
const { AppError } = require('../helpers/app-error');
const { HTTP_STATUS } = require('../entities');

/**
 * Lookup de datos personales de médicos en `usuarios`.
 *
 * `medicos.id` es FK a `usuarios.id`; el nombre/apellido se resuelve aquí
 * porque PostgREST no puede inferir el join inverso de forma confiable.
 */
const findDoctorsUsersByMedicoIds = async (rows) => {
  const ids = [...new Set(rows.map((r) => r.medico_id).filter((v) => !!v))];
  if (ids.length === 0) {
    return new Map();
  }

  try {
    const { rows: data } = await query(
      'SELECT id, nombre, apellido FROM usuarios WHERE id = ANY($1::uuid[])',
      [ids],
    );

    return new Map((data || []).map((u) => [u.id, u]));
  } catch (err) {
    throw new AppError(
      'No se pudo obtener la información de los médicos',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

module.exports = {
  findDoctorsUsersByMedicoIds,
};
