const { HTTP_STATUS } = require('../entities');
const familyMedicalHistoryService = require('../services/familyMedicalHistory.service');
const { handleControllerError } = require('../helpers/handle-controller-error');

/**
 * Controller "Historial Médico de un Familiar".
 *
 * Único responsable de orquestar la request HTTP: extrae datos del request,
 * delega en el service y formatea la respuesta. Sin lógica de negocio ni
 * acceso directo a Supabase.
 */

const getMedicalHistory = async (req, res) => {
  try {
    const data = await familyMedicalHistoryService.getFamilyMedicalHistory(
      req.user.id,
      req.params.familyMemberId,
    );
    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

module.exports = { getMedicalHistory };
