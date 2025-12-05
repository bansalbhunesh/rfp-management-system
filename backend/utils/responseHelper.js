/**
 * Standardized API response helper
 * Ensures all endpoints return consistent { success, data, error } format
 */

function success(data, message = null) {
  return {
    success: true,
    data,
    ...(message && { message })
  };
}

function error(message, details = null, statusCode = 400) {
  const response = {
    success: false,
    error: message
  };
  
  if (details) {
    response.details = details;
  }
  
  // Attach status code for middleware
  response.statusCode = statusCode;
  
  return response;
}

module.exports = {
  success,
  error
};

