/**
 * Thailand Timezone Utility Functions for Client-Side (Frontend)
 *
 * This utility provides consistent timezone handling for the frontend application.
 * These functions work in the browser environment.
 */

const THAILAND_TIMEZONE = 'Asia/Bangkok';

/**
 * Get current date in Thailand timezone as YYYY-MM-DD string
 * @returns {string} Current date in Thailand timezone as YYYY-MM-DD
 */
export function getThailandTodayString() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: THAILAND_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(now); // Returns YYYY-MM-DD format
}

/**
 * Format date for display in Thailand locale
 * @param {string|Date} dateInput - Date to format
 * @param {string} format - Format type: 'short' (dd/mm/yyyy), 'long' (Thai month name), 'thai' (Thai locale)
 * @returns {string} Formatted date string
 */
export function formatThailandDate(dateInput, format = 'thai') {
  if (!dateInput) return '';

  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return '';

  switch (format) {
    case 'short':
      return date.toLocaleDateString('en-GB'); // dd/mm/yyyy format
    case 'long':
      return date.toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'thai':
    default:
      return date.toLocaleDateString('th-TH');
  }
}

/**
 * Check if a date string is valid
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @returns {boolean} True if valid date
 */
export function isValidDateString(dateString) {
  if (!dateString || typeof dateString !== 'string') return false;

  const date = new Date(dateString);
  return !isNaN(date.getTime()) && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
}

/**
 * Convert date string to display format
 * @param {string} dateString - Date string in YYYY-MM-DD format
 * @param {string} format - Display format
 * @returns {string} Formatted date for display
 */
export function dateStringToDisplay(dateString, format = 'thai') {
  if (!isValidDateString(dateString)) return '';

  return formatThailandDate(dateString, format);
}

/**
 * Get current Thailand time as Date object
 * @returns {Date} Current time adjusted for Thailand timezone
 */
export function getThailandNow() {
  return new Date();
}

/**
 * Add days to a date string and return new date string
 * @param {string} dateString - Base date in YYYY-MM-DD format
 * @param {number} days - Number of days to add
 * @returns {string} New date string in YYYY-MM-DD format
 */
export function addDaysToDateString(dateString, days) {
  if (!isValidDateString(dateString)) return '';

  const date = new Date(dateString);
  date.setDate(date.getDate() + days);

  return date.toISOString().split('T')[0];
}

/**
 * Check if Thailand time is within business hours
 * @returns {boolean} True if within business hours (8 AM - 6 PM Thailand time)
 */
export function isThailandBusinessHours() {
  const now = new Date();
  const thailandTime = new Intl.DateTimeFormat("en-US", {
    timeZone: THAILAND_TIMEZONE,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit"
  }).format(now);

  const [hours] = thailandTime.split(':').map(Number);
  return hours >= 8 && hours < 18; // 8 AM to 6 PM Thailand time
}

/**
 * Compare two date strings
 * @param {string} date1 - First date string
 * @param {string} date2 - Second date string
 * @returns {number} -1 if date1 < date2, 0 if equal, 1 if date1 > date2
 */
export function compareDateStrings(date1, date2) {
  if (!isValidDateString(date1) || !isValidDateString(date2)) {
    return 0;
  }

  const d1 = new Date(date1);
  const d2 = new Date(date2);

  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
}

/**
 * Get date range for current month in YYYY-MM-DD format
 * @returns {Object} {start: string, end: string} Month range strings
 */
export function getThailandCurrentMonthRange() {
  const today = getThailandTodayString();
  const [year, month] = today.split('-').map(Number);

  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate(); // Get last day of month
  const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

  return { start, end };
}