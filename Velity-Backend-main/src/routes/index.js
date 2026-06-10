const express = require('express');
const healthController = require('../controllers/health.controller');
const supabaseController = require('../controllers/supabase.controller');
const profileRoutes = require('./profile.routes');
const medicalHistoryRoutes = require('./medicalHistory.routes');
const familyRoutes = require('./family.routes');
const familyMedicalHistoryRoutes = require('./familyMedicalHistory.routes');
const appointmentsRoutes = require('./appointments.routes');

const router = express.Router();

router.get('/', healthController.getStatus);
router.get('/api/db-test', supabaseController.dbTest);
router.use('/api/profile', profileRoutes);
router.use('/api/medical-history', medicalHistoryRoutes);
router.use('/api/family', familyRoutes);
router.use('/api/family', familyMedicalHistoryRoutes);
router.use('/api/appointments', appointmentsRoutes);

module.exports = router;
