const profileRepository = require('../repositories/profile.repository');
const healthStatusRepository = require('../repositories/healthStatus.repository');
const { AppError } = require('../helpers/app-error');
const { HTTP_STATUS } = require('../entities');
const { countChronicConditions, buildHealthStatusDetail } = require('../helpers/health-status');
const {
  toUserDTO,
  toAllergiesDTO,
  toConditionsDTO,
  toCriticalHistoryDTO,
} = require('../entities/profile.entity');

const UPDATABLE_FIELDS = [
  'nombre',
  'apellido',
  'telefono',
  'sexo',
  'peso_kg',
  'altura_cm',
  'foto_url',
];

const getMyProfile = async (userId) => {
  const [user, allergies, conditions, criticalHistory, activeMedications] = await Promise.all([
    profileRepository.findUserById(userId),
    profileRepository.findAllergiesByUserId(userId),
    profileRepository.findConditionsByUserId(userId),
    profileRepository.findCriticalHistoryByUserId(userId),
    healthStatusRepository.findActiveMedicationsByUserId(userId),
  ]);

  if (!user) {
    throw new AppError('Usuario no encontrado', HTTP_STATUS.NOT_FOUND);
  }

  const activeMedicationsCount = activeMedications.length;
  const chronicConditionsCount = countChronicConditions(conditions);

  const healthStatus = buildHealthStatusDetail({
    activeMedicationsCount,
    chronicConditionsCount,
    hasCriticalAlerts: criticalHistory.length > 0,
  });

  return {
    user: toUserDTO(user),
    healthStatus,
    allergies: toAllergiesDTO(allergies),
    conditions: toConditionsDTO(conditions),
    criticalHistory: toCriticalHistoryDTO(criticalHistory),
  };
};

const updateMyProfile = async (userId, data) => {
  const payload = {};
  UPDATABLE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(data, field)) {
      payload[field] = data[field];
    }
  });

  if (Object.keys(payload).length === 0) {
    throw new AppError('No hay campos válidos para actualizar', HTTP_STATUS.BAD_REQUEST);
  }

  await profileRepository.updateUserById(userId, payload);

  return getMyProfile(userId);
};

module.exports = { getMyProfile, updateMyProfile };
