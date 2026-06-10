const supabaseRepository = require('../repositories/supabase.repository');

const getUsers = async () => {
  return supabaseRepository.listUsers(5);
};

module.exports = {
  getUsers,
};
