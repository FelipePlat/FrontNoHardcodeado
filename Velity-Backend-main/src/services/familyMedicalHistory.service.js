const familyMedicalHistoryRepository = require('../repositories/familyMedicalHistory.repository');
const usersRepository = require('../repositories/users.repository');
const { AppError } = require('../helpers/app-error');
const { HTTP_STATUS } = require('../entities');
const {
  buildFamilyMemberDTO,
  buildSummary,
  toRecordDTO,
} = require('../entities/familyMedicalHistory.entity');

/**
 * Service "Historial Médico de un Familiar".
 *
 * Toda la lógica de negocio (validación de acceso, distinción 404/403,
 * carga del historial, agrupación, ordenamiento y mapeo a DTOs) vive aquí.
 * Las consultas a Supabase viven en `familyMedicalHistory.repository`.
 */

/**
 * Verifica que:
 *   1. El `familyMemberId` exista como usuario (404 si no).
 *   2. El usuario autenticado tenga relación de "familiar" sobre él (403 si no).
 *
 * Devuelve los datos del familiar (`{ id, nombre, apellido, foto_url }`)
 * para evitar una segunda query a `usuarios` al construir el DTO.
 *
 * Se hacen dos lookups separados (en lugar de uno solo a `familiares`) para
 * poder distinguir 404 (no existe) vs 403 (existe pero no es tu familiar),
 * que es lo que exige la consigna de este endpoint.
 */
const validateAndLoadFamilyMember = async (userId, familyMemberId) => {
  const member = await familyMedicalHistoryRepository.findUserBasicById(familyMemberId);
  if (!member) {
    throw new AppError('Familiar no encontrado', HTTP_STATUS.NOT_FOUND);
  }

  const relation = await familyMedicalHistoryRepository.findFamilyRelation(userId, familyMemberId);
  if (!relation) {
    throw new AppError(
      'No tienes permisos para acceder al historial de este familiar',
      HTTP_STATUS.FORBIDDEN,
    );
  }

  return member;
};

const mapRowsToRecordDTOs = async (rows) => {
  const usuariosMap = await usersRepository.findDoctorsUsersByMedicoIds(rows);
  return rows.map((row) => toRecordDTO(row, usuariosMap));
};

/**
 * Caso de uso principal del feature.
 *
 *   1. Valida acceso (404/403).
 *   2. Carga el historial completo del familiar.
 *   3. Si no hay historial → 404.
 *   4. Construye `familyMember`, `summary` y `records`.
 */
const getFamilyMedicalHistory = async (userId, familyMemberId) => {
  const member = await validateAndLoadFamilyMember(userId, familyMemberId);

  const rows = await familyMedicalHistoryRepository.findHistorialByPacienteId(familyMemberId);

  if (rows.length === 0) {
    throw new AppError('El familiar no tiene historial médico registrado', HTTP_STATUS.NOT_FOUND);
  }

  const records = await mapRowsToRecordDTOs(rows);

  return {
    familyMember: buildFamilyMemberDTO(member),
    summary: buildSummary(rows),
    records,
  };
};

module.exports = {
  validateAndLoadFamilyMember,
  getFamilyMedicalHistory,
};
