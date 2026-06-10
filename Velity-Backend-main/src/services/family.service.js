const familyRepository = require('../repositories/family.repository');
const healthStatusRepository = require('../repositories/healthStatus.repository');
const { countChronicConditions, resolveHealthStatusLabel } = require('../helpers/health-status');
const { toFamilyMemberCardDTO } = require('../entities/family.entity');

/**
 * Calcula el "estado de salud resumido" de cualquier usuario (paciente).
 * Usa la misma regla compartida que el módulo Perfil.
 */
const computeHealthStatusForUser = async (userId) => {
  const { activeMedications, conditions } =
    await healthStatusRepository.findHealthStatusInputsByUserId(userId);

  return resolveHealthStatusLabel(activeMedications.length, countChronicConditions(conditions));
};

const getFamilyMembers = async (userId) => {
  const rows = await familyRepository.findFamilyMembersByUserId(userId);

  const healthStatuses = await Promise.all(
    rows.map((row) => computeHealthStatusForUser(row.familiar_id)),
  );

  const cards = rows.map((row, i) =>
    toFamilyMemberCardDTO(row, row.familiar || {}, healthStatuses[i]),
  );

  cards.sort((a, b) =>
    String(a.fullName || '').localeCompare(String(b.fullName || ''), 'es', {
      sensitivity: 'base',
    }),
  );

  return cards;
};

module.exports = {
  computeHealthStatusForUser,
  getFamilyMembers,
};
