const { calculateAge } = require('../helpers/age');

const toNumberOrNull = (value) => (value === null || value === undefined ? null : Number(value));

const buildPermissionsDTO = (familiarRow) => ({
  medicalHistory: familiarRow.acceso_historial === true,
  medications: familiarRow.acceso_medicamentos === true,
  appointments: familiarRow.acceso_turnos === true,
});

const buildFullName = (usuario) =>
  `${(usuario && usuario.nombre) || ''} ${(usuario && usuario.apellido) || ''}`.trim() || null;

/**
 * DTO usado en la lista de familiares (tarjetas).
 */
const toFamilyMemberCardDTO = (familiarRow, usuario, healthStatus) => ({
  id: usuario.id,
  fullName: buildFullName(usuario),
  relationship: familiarRow.parentesco || null,
  photoUrl: usuario.foto_url || null,
  age: calculateAge(usuario.fecha_nacimiento),
  weight: toNumberOrNull(usuario.peso_kg),
  height: toNumberOrNull(usuario.altura_cm),
  healthStatus,
  permissions: buildPermissionsDTO(familiarRow),
});

module.exports = {
  toFamilyMemberCardDTO,
  buildPermissionsDTO,
};
