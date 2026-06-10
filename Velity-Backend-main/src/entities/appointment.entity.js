/**
 * Entidad/DTOs de Turnos.
 *
 * Convierte filas de `turnos` (con embeds a especialidades, lugares y médicos)
 * a las estructuras esperadas por el frontend. El nombre del médico se
 * resuelve mediante un `Map<medicoId, { nombre, apellido }>` que se construye
 * en una segunda query a `usuarios` (mismo patrón que historial médico,
 * porque `medicos.id` es FK a `usuarios.id`).
 */

const toNumberOrNull = (value) => (value === null || value === undefined ? null : Number(value));

const buildDoctor = (row, usuariosMap) => {
  if (!row.medico_id) {
    return null;
  }
  const usuario = usuariosMap.get(row.medico_id);
  if (!usuario) {
    return null;
  }
  const fullName = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
  return fullName || null;
};

const buildLocationName = (row) => {
  if (row.lugar && row.lugar.nombre) {
    return row.lugar.nombre;
  }
  return row.centro_nombre || null;
};

const buildLocationAddress = (row) => {
  if (row.lugar && row.lugar.direccion) {
    return row.lugar.direccion;
  }
  return row.centro_direccion || null;
};

const buildSpecialty = (row) => {
  if (row.especialidad && row.especialidad.nombre) {
    return row.especialidad.nombre;
  }
  return null;
};

/**
 * DTO usado en GET /api/appointments/day/:date.
 * Resumen liviano por turno.
 */
const toAppointmentDayDTO = (row, usuariosMap) => ({
  id: row.id,
  dateTime: row.fecha_hora,
  specialty: buildSpecialty(row),
  doctor: buildDoctor(row, usuariosMap),
  location: buildLocationName(row),
  status: row.estado,
});

/**
 * DTO usado en:
 *  - GET /api/appointments/:appointmentId
 *  - POST /api/appointments (respuesta)
 *  - PUT /api/appointments/:appointmentId (respuesta)
 */
const toAppointmentDetailDTO = (row, usuariosMap) => ({
  id: row.id,
  dateTime: row.fecha_hora,
  specialty: buildSpecialty(row),
  doctor: buildDoctor(row, usuariosMap),
  location: buildLocationName(row),
  address: buildLocationAddress(row),
  appointmentType: row.tipo,
  status: row.estado,
  notes: row.notas || null,
  instructions: row.indicaciones_previas || null,
  cost: toNumberOrNull(row.costo),
  coveredByInsurance: row.cubierto_os === true,
  videoCallLink: row.link_videollamada || null,
});

module.exports = {
  toAppointmentDayDTO,
  toAppointmentDetailDTO,
};
