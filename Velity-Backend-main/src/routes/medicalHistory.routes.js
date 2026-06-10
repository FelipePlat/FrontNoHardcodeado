const express = require('express');
const controller = require('../controllers/medicalHistory.controller');
const { authenticate } = require('../helpers/auth.middleware');
const { validateFilters, validateRecordId } = require('../helpers/medicalHistory.validator');

const router = express.Router();

router.get('/', authenticate, controller.getAll);
router.get('/filter', authenticate, validateFilters, controller.getByFilters);
router.get('/:recordId', authenticate, validateRecordId, controller.getOne);

module.exports = router;
