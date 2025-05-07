/**
 * Time utility functions for formatting and manipulating time values
 */

/**
 * Format seconds into HH:MM:SS format
 * @param {number} seconds - Total seconds to format
 * @returns {string} - Formatted time string
 */
export const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return "00:00:00";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format seconds into a human-readable format (e.g., "1h 23m 45s")
 * @param {number} seconds - Total seconds to format
 * @returns {string} - Human-readable time string
 */
export const formatTimeHuman = (seconds) => {
  if (!seconds && seconds !== 0) return "0s";
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  let result = '';
  
  if (hours > 0) {
    result += `${hours}h `;
  }
  
  if (minutes > 0 || hours > 0) {
    result += `${minutes}m `;
  }
  
  result += `${secs}s`;
  
  return result;
};

/**
 * Get current date and time in ISO format
 * @returns {string} - Current date and time in ISO format
 */
export const getCurrentDateTime = () => {
  return new Date().toISOString();
};

/**
 * Format a date string to a human-readable format
 * @param {string} dateString - Date string in ISO format
 * @returns {string} - Formatted date string
 */
export const formatDate = (dateString) => {
  const date = new Date(dateString);
  
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculate time difference between two dates in seconds
 * @param {Date|string} startDate - Start date
 * @param {Date|string} endDate - End date
 * @returns {number} - Time difference in seconds
 */
export const getTimeDiffInSeconds = (startDate, endDate) => {
  const start = startDate instanceof Date ? startDate : new Date(startDate);
  const end = endDate instanceof Date ? endDate : new Date(endDate);
  
  return Math.abs(Math.floor((end - start) / 1000));
};

/**
 * Check if a date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean} - True if the date is today
 */
export const isToday = (date) => {
  const today = new Date();
  const checkDate = date instanceof Date ? date : new Date(date);
  
  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
};

/**
 * Get start and end dates for various time periods
 * @param {string} period - Time period ('day', 'week', 'month', 'year')
 * @returns {Object} - Object containing start and end dates
 */
export const getDateRangeForPeriod = (period) => {
  const now = new Date();
  const start = new Date(now);
  
  switch (period) {
    case 'day':
      start.setHours(0, 0, 0, 0);
      break;
    case 'week':
      start.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      start.setHours(0, 0, 0, 0);
      break;
    case 'month':
      start.setDate(1); // Start of month
      start.setHours(0, 0, 0, 0);
      break;
    case 'year':
      start.setMonth(0, 1); // Start of year (January 1)
      start.setHours(0, 0, 0, 0);
      break;
    default:
      // Default to 'day'
      start.setHours(0, 0, 0, 0);
  }
  
  return {
    startDate: start.toISOString(),
    endDate: now.toISOString()
  };
}; 