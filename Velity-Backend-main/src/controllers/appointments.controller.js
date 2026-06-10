const { HTTP_STATUS } = require('../entities');
const appointmentsService = require('../services/appointments.service');
const { handleControllerError } = require('../helpers/handle-controller-error');

const getCalendar = async (req, res) => {
  try {
    const { month, year } = req.validatedQuery;
    const data = await appointmentsService.getCalendar(req.user.id, month, year);
    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getByDay = async (req, res) => {
  try {
    const data = await appointmentsService.getAppointmentsByDay(req.user.id, req.params.date);
    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const getOne = async (req, res) => {
  try {
    const data = await appointmentsService.getAppointmentDetail(
      req.user.id,
      req.params.appointmentId,
    );
    return res.status(HTTP_STATUS.OK).json({ success: true, data });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const create = async (req, res) => {
  try {
    const data = await appointmentsService.createAppointment(req.user.id, req.validatedBody);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Turno creado correctamente',
      data,
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const update = async (req, res) => {
  try {
    const data = await appointmentsService.updateAppointment(
      req.user.id,
      req.params.appointmentId,
      req.validatedBody,
    );
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Turno actualizado correctamente',
      data,
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

const remove = async (req, res) => {
  try {
    await appointmentsService.deleteAppointment(req.user.id, req.params.appointmentId);
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Turno eliminado correctamente',
    });
  } catch (error) {
    return handleControllerError(res, error);
  }
};

module.exports = {
  getCalendar,
  getByDay,
  getOne,
  create,
  update,
  remove,
};
