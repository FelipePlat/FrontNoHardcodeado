const express = require('express');
const controller = require('../controllers/appointments.controller');
const { authenticate } = require('../helpers/auth.middleware');
const {
  validateAppointmentId,
  validateDateParam,
  validateCalendarQuery,
  validateCreateAppointment,
  validateUpdateAppointment,
} = require('../helpers/appointments.validator');

const router = express.Router();

/**
 * IMPORTANTE: las rutas con segmentos fijos (`calendar`, `day`) deben
 * declararse ANTES que la ruta dinámica `/:appointmentId` para que Express
 * resuelva correctamente cada path.
 */

router.post('/', authenticate, validateCreateAppointment, controller.create);

router.get('/calendar', authenticate, validateCalendarQuery, controller.getCalendar);
router.get('/day/:date', authenticate, validateDateParam, controller.getByDay);

router.get('/:appointmentId', authenticate, validateAppointmentId, controller.getOne);
router.put(
  '/:appointmentId',
  authenticate,
  validateAppointmentId,
  validateUpdateAppointment,
  controller.update,
);
router.delete('/:appointmentId', authenticate, validateAppointmentId, controller.remove);

module.exports = router;
