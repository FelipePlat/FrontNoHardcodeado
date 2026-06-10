const { query } = require('../configs/db');
const { AppError } = require('../helpers/app-error');
const { HTTP_STATUS } = require('../entities');

/**
 * Repositorio de Familia.
 *
 * Centraliza las queries a `familiares` (con embed del usuario familiar).
 * Ningún service accede a la base de datos directamente.
 */

const findFamilyMembersByUserId = async (userId) => {
  try {
    const { rows } = await query(
      `SELECT f.id, f.propietario_id, f.familiar_id, f.parentesco,
              f.acceso_historial, f.acceso_medicamentos, f.acceso_turnos,
              u.id AS fam_id, u.nombre, u.apellido, u.dni, u.email, u.telefono,
              u.foto_url, u.fecha_nacimiento, u.sexo, u.grupo_sanguineo,
              u.peso_kg, u.altura_cm
       FROM familiares f
       JOIN usuarios u ON u.id = f.familiar_id
       WHERE f.propietario_id = $1`,
      [userId],
    );

    return rows.map((row) => ({
      id: row.id,
      propietario_id: row.propietario_id,
      familiar_id: row.familiar_id,
      parentesco: row.parentesco,
      acceso_historial: row.acceso_historial,
      acceso_medicamentos: row.acceso_medicamentos,
      acceso_turnos: row.acceso_turnos,
      familiar: {
        id: row.fam_id,
        nombre: row.nombre,
        apellido: row.apellido,
        dni: row.dni,
        email: row.email,
        telefono: row.telefono,
        foto_url: row.foto_url,
        fecha_nacimiento: row.fecha_nacimiento,
        sexo: row.sexo,
        grupo_sanguineo: row.grupo_sanguineo,
        peso_kg: row.peso_kg,
        altura_cm: row.altura_cm,
      },
    }));
  } catch (_err) {
    throw new AppError(
      'No se pudo obtener la lista de familiares',
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
    );
  }
};

module.exports = {
  findFamilyMembersByUserId,
};
