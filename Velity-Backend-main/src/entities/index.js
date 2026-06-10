const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
};

const SEXO_VALUES = ['masculino', 'femenino', 'otro', 'no_especificado'];

const HEALTH_STATUS = {
  IN_TREATMENT: 'En tratamiento',
  MEDICAL_FOLLOW_UP: 'Con seguimiento médico',
  NO_NEWS: 'Sin novedades',
};

const MEDICAL_RECORD_TIPOS = [
  'estudio',
  'vacuna',
  'enfermedad',
  'antecedente',
  'consulta',
  'diagnostico',
];

const TIPO_TO_CATEGORY = {
  vacuna: 'vaccine',
  estudio: 'study',
  diagnostico: 'diagnosis',
  enfermedad: 'disease',
  consulta: 'consultation',
  antecedente: 'background',
};

const CATEGORY_TO_TIPO = Object.entries(TIPO_TO_CATEGORY).reduce((acc, [tipo, category]) => {
  acc[category] = tipo;
  return acc;
}, {});

const CATEGORY_VALUES = Object.values(TIPO_TO_CATEGORY);

/**
 * Tipos válidos de turno (restringidos por CHECK constraint en `turnos.tipo`).
 */
const APPOINTMENT_TYPES = ['presencial', 'telemedicina'];

/**
 * Estados válidos de un turno (restringidos por CHECK constraint en
 * `turnos.estado`). El estado por defecto al crear es 'programado'.
 */
const APPOINTMENT_STATUSES = [
  'programado',
  'confirmado',
  'completado',
  'cancelado',
  'reprogramado',
];

const APPOINTMENT_DEFAULT_STATUS = 'programado';

module.exports = {
  HTTP_STATUS,
  SEXO_VALUES,
  HEALTH_STATUS,
  MEDICAL_RECORD_TIPOS,
  TIPO_TO_CATEGORY,
  CATEGORY_TO_TIPO,
  CATEGORY_VALUES,
  APPOINTMENT_TYPES,
  APPOINTMENT_STATUSES,
  APPOINTMENT_DEFAULT_STATUS,
};
