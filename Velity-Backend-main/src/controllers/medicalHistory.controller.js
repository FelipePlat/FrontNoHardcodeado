const { HTTP_STATUS } = require('../entities');
const medicalHistoryService = require('../services/medicalHistory.service');
const { handleControllerError } = require('../helpers/handle-controller-error');

const getAll = async (req, res) => {
  try {
    const data = await medicalHistoryService.getMedicalHistory(req.user.id);
    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getByFilters = async (req, res) => {
  try {
    const data = await medicalHistoryService.getMedicalHistoryByFilters(
      req.user.id,
      req.validatedFilters,
    );
    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getOne = async (req, res) => {
  try {
    const data = await medicalHistoryService.getMedicalRecord(req.user.id, req.params.recordId);
    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

module.exports = { getAll, getByFilters, getOne };
