const { HTTP_STATUS } = require('../entities');
const supabaseRepository = require('../repositories/supabase.repository');

const dbTest = async (_req, res) => {
  try {
    const connection = await supabaseRepository.probarConexionDb();
    if (!connection.ok) {
      return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error al conectar con la base de datos',
        error: connection.error,
      });
    }

    const data = await supabaseRepository.listUsers();

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      db: connection.result,
      count: Array.isArray(data) ? data.length : 0,
      data: data || [],
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Error al conectar con la base de datos',
      error: error.message,
    });
  }
};

module.exports = {
  dbTest,
};
