const { HTTP_STATUS } = require('../entities');

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUUID = (value) => typeof value === 'string' && UUID_REGEX.test(value);

const isProvided = (value) => value !== undefined && value !== null && value !== '';

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const badRequest = (res, message) =>
  res.status(HTTP_STATUS.BAD_REQUEST).json({ success: false, message });

module.exports = {
  UUID_REGEX,
  isUUID,
  isProvided,
  isNonEmptyString,
  badRequest,
};
