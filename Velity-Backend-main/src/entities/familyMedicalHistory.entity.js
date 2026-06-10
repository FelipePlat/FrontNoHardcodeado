/**
 * Entidad/DTOs de "Historial Médico de un Familiar".
 *
 * Convierte filas de `historial_medico` (con embeds a lugares, vacunas,
 * estudios, adjuntos y médicos) a la estructura esperada por el frontend.
 *
 * Diferencias semánticas con el DTO del módulo Historial Médico propio:
 *   - `type` (no `category`): se devuelve el `tipo` crudo de la BD.
 *   - `isCritical` (no `critical`).
 *   - `institution` incluye `type` (tipo de lugar).
 *   - `vaccine` solo expone `id`, `name`, `dose`, `lot`.
 *   - `attachments[]` incluye `fileSize` (`tamanio_bytes`).
 *   - `vaccine` y `study` se devuelven cuando los IDs existen,
 *     independientemente de `tipo`.
 */

const buildFullName = (usuario) => {
  if (!usuario) return null;
  const fullName = `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim();
  return fullName || null;
};

const buildFamilyMemberDTO = (user) => ({
  id: user.id,
  fullName: buildFullName(user),
  photoUrl: user.foto_url || null,
});

/**
 * Construye el resumen sobre los registros ya obtenidos. Se calcula en
 * memoria para evitar queries adicionales.
 */
const buildSummary = (rows = []) => {
  let criticalRecords = 0;
  let lastRecordDate = null;

  rows.forEach((row) => {
    if (row.es_critico === true) {
      criticalRecords += 1;
    }
    if (row.fecha && (!lastRecordDate || row.fecha > lastRecordDate)) {
      lastRecordDate = row.fecha;
    }
  });

  return {
    totalRecords: rows.length,
    criticalRecords,
    lastRecordDate,
  };
};

const buildInstitution = (row) => {
  if (!row.institucion) {
    return null;
  }
  return {
    id: row.institucion.id,
    name: row.institucion.nombre,
    type: row.institucion.tipo || null,
  };
};

const buildDoctor = (row, usuariosMap) => {
  if (!row.medico) {
    return null;
  }
  const medicoId = row.medico.id;
  const usuario = usuariosMap.get(medicoId);
  return {
    id: medicoId,
    fullName: buildFullName(usuario),
    specialty: row.medico.especialidad ? row.medico.especialidad.nombre : null,
  };
};

const buildVaccine = (row) => {
  if (!row.vacuna) {
    return null;
  }
  return {
    id: row.vacuna.id,
    name: row.vacuna.nombre,
    dose: row.vacuna_dosis || null,
    lot: row.vacuna_nro_lote || null,
  };
};

const buildStudy = (row) => {
  if (!row.estudio) {
    return null;
  }
  return {
    id: row.estudio.id,
    name: row.estudio.nombre,
  };
};

const buildAttachments = (rows = []) =>
  rows.map((att) => ({
    id: att.id,
    fileName: att.nombre_archivo,
    fileType: att.tipo_archivo || null,
    fileSize:
      att.tamanio_bytes === null || att.tamanio_bytes === undefined
        ? null
        : Number(att.tamanio_bytes),
    storagePath: att.storage_path,
  }));

const toRecordDTO = (row, usuariosMap) => ({
  id: row.id,
  type: row.tipo,
  title: row.titulo,
  description: row.descripcion || null,
  date: row.fecha,
  isCritical: row.es_critico === true,
  diagnosis: row.diagnostico || null,
  treatment: row.tratamiento || null,
  institution: buildInstitution(row),
  doctor: buildDoctor(row, usuariosMap),
  vaccine: buildVaccine(row),
  study: buildStudy(row),
  attachments: buildAttachments(row.attachments),
});

module.exports = {
  buildFamilyMemberDTO,
  buildSummary,
  toRecordDTO,
};
