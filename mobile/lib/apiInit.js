import { apiConfig, logApiConfig } from './apiConfig';

/**
 * Initialize API configuration and log current settings
 * Call this early in your app startup (e.g., in App.js or main component)
 */
export const initializeApi = () => {
  // Log current API configuration in development
  if (apiConfig.isDevelopment) {
    logApiConfig();
  }
  
  return apiConfig;
};

/**
 * Get current API configuration
 * @returns {Object} API configuration object
 */
export const getApiConfig = () => apiConfig;

/**
 * Check if API is properly configured
 * @returns {boolean} True if API URLs are available
 */
export const isApiConfigured = () => {
  const config = apiConfig.env;
  return !!(config.apiDev && config.apiProd);
};

/**
 * Get API health check URL
 * @returns {string} Health check endpoint URL
 */
export const getHealthCheckUrl = () => {
  return `${apiConfig.baseUrl}/health`;
};

export default {
  initialize: initializeApi,
  getConfig: getApiConfig,
  isConfigured: isApiConfigured,
  getHealthCheckUrl
};