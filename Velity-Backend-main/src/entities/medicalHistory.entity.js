const { TIPO_TO_CATEGORY } = require('./index');

/**
 * Convierte un map de usuarios { id: { nombre, apellido } } y un map de
 * adjuntos { historialId: [...] } al DTO final esperado por el frontend.
 */

const buildDoctor = (row, usuariosMap) => {
  if (!row.medico) {
    return null;
  }
  const medicoId = row.medico.id;
  const usuario = usuariosMap.get(medicoId);
  const fullName = usuario
    ? `${usuario.nombre || ''} ${usuario.apellido || ''}`.trim() || null
    : null;
  return {
    id: medicoId,
    fullName,
    specialty: row.medico.especialidad ? row.medico.especialidad.nombre : null,
  };
};

const buildInstitution = (row) => {
  if (!row.institucion) {
    return null;
  }
  return {
    id: row.institucion.id,
    name: row.institucion.nombre,
  };
};

const buildVaccineInfo = (row) => {
  if (row.tipo !== 'vacuna') {
    return undefined;
  }
  return {
    name: row.vacuna ? row.vacuna.nombre : null,
    dose: row.vacuna_dosis || null,
    lot: row.vacuna_nro_lote || null,
    expirationDate: row.vacuna_vencimiento || null,
    center: row.vacuna_centro || null,
  };
};

const buildStudyInfo = (row) => {
  if (row.tipo !== 'estudio') {
    return undefined;
  }
  return {
    name: row.estudio ? row.estudio.nombre : null,
  };
};

const buildAttachments = (rows = []) =>
  rows.map((att) => ({
    id: att.id,
    fileName: att.nombre_archivo,
    fileType: att.tipo_archivo || null,
    storagePath: att.storage_path,
  }));

const toRecordDTO = (row, usuariosMap) => {
  const base = {
    id: row.id,
    category: TIPO_TO_CATEGORY[row.tipo] || row.tipo,
    title: row.titulo,
    description: row.descripcion || null,
    date: row.fecha,
    diagnosis: row.diagnostico || null,
    treatment: row.tratamiento || null,
    critical: row.es_critico === true,
    institution: buildInstitution(row),
    doctor: buildDoctor(row, usuariosMap),
    attachments: buildAttachments(row.attachments),
  };

  const vaccine = buildVaccineInfo(row);
  if (vaccine) {
    base.vaccine = vaccine;
  }

  const study = buildStudyInfo(row);
  if (study) {
    base.study = study;
  }

  return base;
};

const toChronicConditionDTO = (row) => ({
  id: row.id,
  title: row.titulo,
  description: row.descripcion || null,
  date: row.fecha,
});

/**
 * Construye el resumen superior a partir de los registros ya obtenidos.
 * Evita hacer 4 queries adicionales: se calcula en memoria.
 */
const buildSummary = (rows = []) => {
  let totalVaccines = 0;
  let totalStudies = 0;
  let totalDiagnoses = 0;
  let lastRecordDate = null;

  rows.forEach((row) => {
    if (row.tipo === 'vacuna') totalVaccines += 1;
    if (row.tipo === 'estudio') totalStudies += 1;
    if (row.tipo === 'diagnostico') totalDiagnoses += 1;
    if (row.fecha && (!lastRecordDate || row.fecha > lastRecordDate)) {
      lastRecordDate = row.fecha;
    }
  });

  return {
    totalRecords: rows.length,
    totalVaccines,
    totalStudies,
    totalDiagnoses,
    lastRecordDate,
  };
};

module.exports = {
  toRecordDTO,
  toChronicConditionDTO,
  buildSummary,
};
