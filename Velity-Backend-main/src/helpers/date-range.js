/**
 * Helper para construir rangos de fecha-hora en zona horaria de Argentina.
 *
 * `turnos.fecha_hora` es `timestamptz`: postgres lo persiste en UTC pero
 * acepta cualquier offset al filtrar. Para que el "día/mes" interpretado por
 * el usuario coincida con el calendario local argentino, usamos offset fijo
 * `-03:00`.
 */

const ARGENTINA_OFFSET = '-03:00';
const ARGENTINA_OFFSET_MS = -3 * 60 * 60 * 1000;

const isValidDateString = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isValidYYYYMMDD = (value) => {
  if (!isValidDateString(value)) {
    return false;
  }
  const [y, m, d] = value.split('-').map(Number);
  if (m < 1 || m > 12) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
};

/**
 * Devuelve [from, to) cubriendo el día completo `dateStr` en zona Argentina.
 */
const buildDayRange = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d));
  next.setUTCDate(next.getUTCDate() + 1);
  const ny = next.getUTCFullYear();
  const nm = String(next.getUTCMonth() + 1).padStart(2, '0');
  const nd = String(next.getUTCDate()).padStart(2, '0');

  return {
    from: `${dateStr}T00:00:00${ARGENTINA_OFFSET}`,
    to: `${ny}-${nm}-${nd}T00:00:00${ARGENTINA_OFFSET}`,
  };
};

/**
 * Devuelve [from, to) cubriendo el mes completo (`month` 1-12, `year` YYYY)
 * en zona Argentina.
 */
const buildMonthRange = (month, year) => {
  const m = String(month).padStart(2, '0');
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const nm = String(nextMonth).padStart(2, '0');

  return {
    from: `${year}-${m}-01T00:00:00${ARGENTINA_OFFSET}`,
    to: `${nextYear}-${nm}-01T00:00:00${ARGENTINA_OFFSET}`,
  };
};

/**
 * Dado un timestamp (ISO o Date) devuelve el día del mes (1-31) en zona
 * Argentina. Se usa para el endpoint de calendario que solo necesita los
 * días que tienen turnos.
 */
const extractArgentinaDayOfMonth = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const localized = new Date(date.getTime() + ARGENTINA_OFFSET_MS);
  return localized.getUTCDate();
};

module.exports = {
  ARGENTINA_OFFSET,
  isValidYYYYMMDD,
  buildDayRange,
  buildMonthRange,
  extractArgentinaDayOfMonth,
};
