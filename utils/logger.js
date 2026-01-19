const logDebug = (message, data = null) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${message}`, data || '');
  }
};

const logError = (message, error = null) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] ${message}`, error || '');
  } else {
    // En production, log sans données sensibles
    console.error(`[ERROR] ${message}`);
  }
};

module.exports = { logDebug, logError };
