const medicalHistoryRepository = require('../repositories/medicalHistory.repository');
const usersRepository = require('../repositories/users.repository');
const { AppError } = require('../helpers/app-error');
const { HTTP_STATUS, CATEGORY_TO_TIPO } = require('../entities');
const {
  toRecordDTO,
  toChronicConditionDTO,
  buildSummary,
} = require('../entities/medicalHistory.entity');

const mapRowsToDTOs = async (rows) => {
  const usuariosMap = await usersRepository.findDoctorsUsersByMedicoIds(rows);
  return rows.map((row) => toRecordDTO(row, usuariosMap));
};

const getMedicalHistory = async (userId) => {
  const [rows, chronic] = await Promise.all([
    medicalHistoryRepository.findHistorialBaseByUserId(userId),
    medicalHistoryRepository.findChronicConditionsByUserId(userId),
  ]);

  const records = await mapRowsToDTOs(rows);

  return {
    summary: buildSummary(rows),
    chronicConditions: chronic.map(toChronicConditionDTO),
    records,
  };
};

const isValidYear = (value) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1900 && n <= 2100;
};

const getMedicalHistoryByFilters = async (userId, filters = {}) => {
  const { category, year, critical } = filters;

  const dbFilters = {};

  if (category && CATEGORY_TO_TIPO[category]) {
    dbFilters.tipo = CATEGORY_TO_TIPO[category];
  }
  if (year && isValidYear(year)) {
    const y = Number(year);
    dbFilters.yearFrom = `${y}-01-01`;
    dbFilters.yearTo = `${y}-12-31`;
  }
  if (critical === true || critical === 'true') {
    dbFilters.es_critico = true;
  } else if (critical === false || critical === 'false') {
    dbFilters.es_critico = false;
  }

  const rows = await medicalHistoryRepository.findHistorialBaseByUserId(userId, dbFilters);
  const records = await mapRowsToDTOs(rows);

  return {
    summary: buildSummary(rows),
    records,
  };
};

const getMedicalRecord = async (userId, recordId) => {
  const data = await medicalHistoryRepository.findRecordById(recordId);

  if (!data) {
    throw new AppError('Registro no encontrado', HTTP_STATUS.NOT_FOUND);
  }
  if (data.paciente_id !== userId) {
    throw new AppError('Acceso denegado', HTTP_STATUS.FORBIDDEN);
  }

  const usuariosMap = await usersRepository.findDoctorsUsersByMedicoIds([data]);
  return toRecordDTO(data, usuariosMap);
};

module.exports = {
  getMedicalHistory,
  getMedicalHistoryByFilters,
  getMedicalRecord,
};
