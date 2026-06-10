const { calculateAge } = require('../helpers/age');

const toNumberOrNull = (value) => (value === null || value === undefined ? null : Number(value));

const toUserDTO = (user) => ({
  id: user.id,
  firstName: user.nombre,
  lastName: user.apellido,
  fullName: `${user.nombre || ''} ${user.apellido || ''}`.trim(),
  email: user.email,
  phone: user.telefono || null,
  birthDate: user.fecha_nacimiento || null,
  age: calculateAge(user.fecha_nacimiento),
  gender: user.sexo || null,
  bloodGroup: user.grupo_sanguineo || null,
  weightKg: toNumberOrNull(user.peso_kg),
  heightCm: toNumberOrNull(user.altura_cm),
  photoUrl: user.foto_url || null,
  obraSocial: user.obra_social ? user.obra_social.nombre : null,
});

const toAllergiesDTO = (rows = []) =>
  rows.map((row) => ({
    id: row.id,
    name: row.nombre_libre || (row.alergia ? row.alergia.descripcion : null),
  }));

const toConditionsDTO = (rows = []) =>
  rows.map((row) => ({
    id: row.id,
    name: row.patologia ? row.patologia.nombre : row.nombre_libre || null,
    type: row.tipo,
  }));

const toCriticalHistoryDTO = (rows = []) =>
  rows.map((row) => ({
    id: row.id,
    title: row.titulo,
    description: row.descripcion || null,
    date: row.fecha,
    diagnosis: row.diagnostico || null,
    treatment: row.tratamiento || null,
  }));

module.exports = {
  toUserDTO,
  toAllergiesDTO,
  toConditionsDTO,
  toCriticalHistoryDTO,
};
