/**
 * Calcula la edad en años a partir de una fecha de nacimiento.
 * La edad NO se almacena en la base: se deriva dinámicamente.
 *
 * @param {string|Date|null} birthDate - fecha_nacimiento (YYYY-MM-DD) o null.
 * @returns {number|null} edad en años o null si no hay fecha válida.
 */
const calculateAge = (birthDate) => {
  if (!birthDate) {
    return null;
  }

  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) {
    return null;
  }

  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();

  const hasNotHadBirthdayThisYear =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate());

  if (hasNotHadBirthdayThisYear) {
    age -= 1;
  }

  return age >= 0 ? age : null;
};

module.exports = { calculateAge };
