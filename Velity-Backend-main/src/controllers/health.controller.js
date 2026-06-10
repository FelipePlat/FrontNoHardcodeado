const { HTTP_STATUS } = require('../entities');

const getStatus = (_req, res) => {
  res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Velity API running',
  });
};

module.exports = {
  getStatus,
};
