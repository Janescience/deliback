/**
 * Thailand Timezone Utility Functions
 *
 * This utility provides consistent timezone handling for the entire application.
 * All dates are stored in UTC in MongoDB but handled as Thailand timezone for business logic.
 */

const THAILAND_TIMEZONE = 'Asia/Bangkok';

/**
 * Get current date in Thailand timezone as UTC Date object
 * @returns {Date} UTC Date representing today in Thailand
 */
export function getThailandToday() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: THAILAND_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const [year, month, day] = formatter.format(now).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Convert date string or Date to Thailand timezone as UTC Date object
 * @param {string|Date} dateInput - Date string (YYYY-MM-DD) or Date object
 * @returns {Date} UTC Date representing the Thailand date
 */
export function getThailandDate(dateInput) {
  if (!dateInput) return null;

  let inputDate;
  if (typeof dateInput === 'string') {
    // Parse date string as Thailand date
    const [year, month, day] = dateInput.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  } else {
    inputDate = new Date(dateInput);
  }

  // Convert to Thailand timezone
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: THAILAND_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const [year, month, day] = formatter.format(inputDate).split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}

/**
 * Get start and end of day in Thailand timezone as UTC Date objects
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {Object} {start: Date, end: Date} - Start and end of Thailand day in UTC
 */
export function getThailandDayRange(dateInput) {
  const thailandDate = getThailandDate(dateInput);
  if (!thailandDate) return { start: null, end: null };

  const start = new Date(thailandDate);
  const end = new Date(thailandDate);
  end.setUTCHours(23, 59, 59, 999);

  return { start, end };
}

/**
 * Get current date and time in Thailand timezone
 * @returns {Date} Current Date object
 */
export function getThailandNow() {
  return new Date();
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
 * Get date range for current month in Thailand timezone
 * @returns {Object} {start: Date, end: Date} - Month range in Thailand timezone
 */
export function getThailandCurrentMonth() {
  const today = getThailandToday();
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();

  const start = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

  return { start, end };
}

/**
 * Get date range for specified month in Thailand timezone
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Object} {start: Date, end: Date} - Month range in Thailand timezone
 */
export function getThailandMonthRange(year, month) {
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  return { start, end };
}

/**
 * Get date range for current year in Thailand timezone
 * @returns {Object} {start: Date, end: Date} - Year range in Thailand timezone
 */
export function getThailandCurrentYear() {
  const today = getThailandToday();
  const year = today.getUTCFullYear();

  const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));

  return { start, end };
}

/**
 * Add days to a Thailand date
 * @param {string|Date} dateInput - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} New date with days added
 */
export function addThailandDays(dateInput, days) {
  const thailandDate = getThailandDate(dateInput);
  if (!thailandDate) return null;

  const newDate = new Date(thailandDate);
  newDate.setUTCDate(newDate.getUTCDate() + days);

  return newDate;
}

/**
 * Convert Thailand date to YYYY-MM-DD string format
 * @param {Date} date - Date object
 * @returns {string} Date in YYYY-MM-DD format
 */
export function toThailandDateString(date) {
  if (!date) return '';

  const d = new Date(date);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

/**
 * Check if a date falls within Thailand business hours
 * @param {Date} date - Date to check
 * @returns {boolean} True if within business hours
 */
export function isThailandBusinessHours(date) {
  const thailandTime = new Intl.DateTimeFormat("en-US", {
    timeZone: THAILAND_TIMEZONE,
    hour12: false,
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);

  const [hours] = thailandTime.split(':').map(Number);
  return hours >= 8 && hours < 18; // 8 AM to 6 PM Thailand time
}

/**
 * Create MongoDB query for Thailand date range
 * @param {string} field - MongoDB field name
 * @param {string|Date} startDate - Start date
 * @param {string|Date} endDate - End date (optional, defaults to same day)
 * @returns {Object} MongoDB query object
 */
export function createThailandDateQuery(field, startDate, endDate = null) {
  const start = getThailandDate(startDate);
  if (!start) return {};

  let end;
  if (endDate) {
    const endRange = getThailandDayRange(endDate);
    end = endRange.end;
  } else {
    const dayRange = getThailandDayRange(startDate);
    end = dayRange.end;
  }

  return {
    [field]: {
      $gte: start,
      $lte: end
    }
  };
}