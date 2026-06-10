const express = require('express');
const profileController = require('../controllers/profile.controller');
const { authenticate } = require('../helpers/auth.middleware');
const { validateUpdateProfile } = require('../helpers/profile.validator');

const router = express.Router();

router.get('/me', authenticate, profileController.getMe);
router.put('/me', authenticate, validateUpdateProfile, profileController.updateMe);

module.exports = router;
