const express = require('express');
const controller = require('../controllers/familyMedicalHistory.controller');
const { authenticate } = require('../helpers/auth.middleware');
const { validateFamilyMemberId } = require('../helpers/family.validator');

/**
 * Rutas del feature "Historial Médico de un Familiar".
 *
 * Se monta bajo `/api/family` (junto a `family.routes.js`). Express
 * combina los routers en orden y, como el path `/:familyMemberId/medical-history`
 * no colisiona con ningún path declarado en `family.routes.js`, ambas
 * funcionalidades coexisten sin conflicto.
 */

const router = express.Router();

router.get(
  '/:familyMemberId/medical-history',
  authenticate,
  validateFamilyMemberId,
  controller.getMedicalHistory,
);

module.exports = router;
