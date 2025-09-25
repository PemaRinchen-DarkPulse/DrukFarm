import Constants from 'expo-constants';

/**
 * API Configuration utility for DrukFarm Mobile App
 * Automatically switches between development and production API URLs
 * based on the build environment and expo configuration
 */

const extra = Constants?.expoConfig?.extra || {};

/**
 * Determines if the app is running in development mode
 * @returns {boolean} True if in development, false if in production
 */
const isDevelopment = () => {
  return __DEV__ || Constants.expoConfig?.extra?.ENV === 'development';
};

/**
 * Gets the appropriate API base URL based on the environment
 * @returns {string} The API base URL without trailing slash
 */
const getApiBaseUrl = () => {
  const apiUrl = isDevelopment() ? extra.API_DEV : extra.API_PROD;
  
  // Fallback to localhost if no URL is configured
  const fallbackUrl = 'http://localhost:5000/api';
  const baseUrl = apiUrl || fallbackUrl;
  
  // Remove trailing slash for consistency
  return baseUrl.replace(/\/$/, '');
};

/**
 * Gets the API origin (base URL without /api path) for image URLs
 * @returns {string} The API origin URL
 */
const getApiOrigin = () => {
  const baseUrl = getApiBaseUrl();
  return baseUrl.replace(/\/api$/i, '');
};

/**
 * Configuration object containing API settings
 */
export const apiConfig = {
  baseUrl: getApiBaseUrl(),
  origin: getApiOrigin(),
  isDevelopment: isDevelopment(),
  
  // Environment info for debugging
  env: {
    isDev: isDevelopment(),
    apiDev: extra.API_DEV,
    apiProd: extra.API_PROD,
    currentUrl: getApiBaseUrl()
  }
};

/**
 * Logs the current API configuration (useful for debugging)
 */
export const logApiConfig = () => {
  console.log('🔧 API Configuration:', {
    'Environment': apiConfig.isDevelopment ? 'Development' : 'Production',
    'Base URL': apiConfig.baseUrl,
    'Origin': apiConfig.origin,
    'Available URLs': {
      dev: extra.API_DEV,
      prod: extra.API_PROD
    }
  });
};

export default apiConfig;