const { HEALTH_STATUS } = require('../entities');

/**
 * Cuenta antecedentes cuya patología asociada es crónica.
 */
const countChronicConditions = (conditions = []) =>
  conditions.filter((row) => row.patologia && row.patologia.es_cronica === true).length;

/**
 * Resuelve la etiqueta de estado de salud según las reglas compartidas
 * entre Perfil y Familia (medicación activa → crónicas → sin novedades).
 */
const resolveHealthStatusLabel = (activeMedicationsCount, chronicConditionsCount) => {
  if (activeMedicationsCount > 0) {
    return HEALTH_STATUS.IN_TREATMENT;
  }
  if (chronicConditionsCount > 0) {
    return HEALTH_STATUS.MEDICAL_FOLLOW_UP;
  }
  return HEALTH_STATUS.NO_NEWS;
};

/**
 * DTO enriquecido usado por GET /api/profile/me.
 */
const buildHealthStatusDetail = ({
  activeMedicationsCount,
  chronicConditionsCount,
  hasCriticalAlerts,
}) => {
  const status = resolveHealthStatusLabel(activeMedicationsCount, chronicConditionsCount);

  return {
    status,
    hasActiveTreatment: activeMedicationsCount > 0,
    hasCriticalAlerts,
    activeMedicationsCount,
    chronicConditionsCount,
  };
};

module.exports = {
  countChronicConditions,
  resolveHealthStatusLabel,
  buildHealthStatusDetail,
};
