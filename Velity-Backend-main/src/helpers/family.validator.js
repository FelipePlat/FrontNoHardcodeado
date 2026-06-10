const { badRequest, isUUID } = require('./validation');

const validateFamilyMemberId = (req, res, next) => {
  const { familyMemberId } = req.params;
  if (!isUUID(familyMemberId || '')) {
    return badRequest(res, 'familyMemberId no es un UUID válido');
  }
  return next();
};

module.exports = { validateFamilyMemberId };
