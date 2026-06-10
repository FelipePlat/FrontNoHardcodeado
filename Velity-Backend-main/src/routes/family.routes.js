const express = require('express');
const controller = require('../controllers/family.controller');
const { authenticate } = require('../helpers/auth.middleware');

const router = express.Router();

router.get('/', authenticate, controller.getMembers);

module.exports = router;
