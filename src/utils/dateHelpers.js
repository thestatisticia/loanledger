import { format, parseISO, isBefore, isAfter, addDays, differenceInDays, isPast, isFuture } from 'date-fns';

/**
 * Format a date string to a readable format
 * @param {string} dateString - ISO date string
 * @param {string} formatString - date-fns format string (default: 'MMM dd, yyyy')
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString, formatString = 'MMM dd, yyyy') => {
  if (!dateString) return 'N/A';
  try {
    return format(parseISO(dateString), formatString);
  } catch (error) {
    return 'Invalid Date';
  }
};

/**
 * Format a date to short format (MM/dd/yyyy)
 */
export const formatDateShort = (dateString) => formatDate(dateString, 'MM/dd/yyyy');

/**
 * Format a date to long format (MMMM dd, yyyy)
 */
export const formatDateLong = (dateString) => formatDate(dateString, 'MMMM dd, yyyy');

/**
 * Check if a date is in the past
 */
export const isDatePast = (dateString) => {
  if (!dateString) return false;
  try {
    return isPast(parseISO(dateString));
  } catch {
    return false;
  }
};

/**
 * Check if a date is in the future
 */
export const isDateFuture = (dateString) => {
  if (!dateString) return false;
  try {
    return isFuture(parseISO(dateString));
  } catch {
    return false;
  }
};

/**
 * Get days until a date (negative if past)
 */
export const daysUntil = (dateString) => {
  if (!dateString) return null;
  try {
    return differenceInDays(parseISO(dateString), new Date());
  } catch {
    return null;
  }
};

/**
 * Check if a date is within N days from now
 */
export const isWithinDays = (dateString, days) => {
  const daysDiff = daysUntil(dateString);
  return daysDiff !== null && daysDiff >= 0 && daysDiff <= days;
};

/**
 * Get today's date as ISO string
 */
export const todayISO = () => new Date().toISOString().split('T')[0];

/**
 * Add days to a date string and return ISO string
 */
export const addDaysToDate = (dateString, days) => {
  if (!dateString) return null;
  try {
    return format(addDays(parseISO(dateString), days), 'yyyy-MM-dd');
  } catch {
    return null;
  }
};

/**
 * Compare two dates
 * @returns {number} Negative if date1 < date2, positive if date1 > date2, 0 if equal
 */
export const compareDates = (dateString1, dateString2) => {
  try {
    const date1 = parseISO(dateString1);
    const date2 = parseISO(dateString2);
    return date1.getTime() - date2.getTime();
  } catch {
    return 0;
  }
};




