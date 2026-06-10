const { HTTP_STATUS } = require('../entities');
const profileService = require('../services/profile.service');
const { handleControllerError } = require('../helpers/handle-controller-error');

const getMe = async (req, res) => {
  try {
    const data = await profileService.getMyProfile(req.user.id);
    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const updateMe = async (req, res) => {
  try {
    const data = await profileService.updateMyProfile(req.user.id, req.validatedBody);
    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

module.exports = { getMe, updateMe };
