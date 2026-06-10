const { HTTP_STATUS } = require('../entities');
const familyService = require('../services/family.service');
const { handleControllerError } = require('../helpers/handle-controller-error');

const getMembers = async (req, res) => {
  try {
    const data = await familyService.getFamilyMembers(req.user.id);
    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

module.exports = { getMembers };
