// API Configuration for different environments
const API_CONFIG = {
  // For production deployment on Hostinger
  production: {
    baseURL: 'https://api.codybanksdata.site/api', // Your backend subdomain
    heroStatsURL: 'https://mlbb-stats.ridwaanhall.com/api/hero-rank/?days=7&rank=mythic&size=50&index=1&sort_field=win_rate&sort_order=desc'
  },
  
  // For local development
  development: {
    baseURL: '/api', // Local development
    heroStatsURL: 'https://mlbb-stats.ridwaanhall.com/api/hero-rank/?days=7&rank=mythic&size=50&index=1&sort_field=win_rate&sort_order=desc'
  }
};

// Get current environment
const isProduction = process.env.NODE_ENV === 'production';
const config = isProduction ? API_CONFIG.production : API_CONFIG.development;

export const API_BASE_URL = config.baseURL;
export const HERO_STATS_URL = config.heroStatsURL;

// Helper function to build API URLs
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

export default config;
