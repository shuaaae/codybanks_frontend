// src/config/api.js

// Use environment variable in production, fallback to /api in development
const API_BASE_URL = 'https://api.coachdatastatistics.site/api';

// Export base URL
export const API_BASE = API_BASE_URL;

// Helper to build full endpoint URLs
export const buildApiUrl = (endpoint) => `${API_BASE_URL}${endpoint}`;

// Example of other API URLs if you need them
// (replace with your actual hero stats API if still needed)
export const HERO_STATS_URL =
  'https://mlbb-stats.ridwaanhall.com/api/hero-rank/?days=7&rank=mythic&size=50&index=1&sort_field=win_rate&sort_order=desc';

export default {
  baseURL: API_BASE_URL,
  heroStatsURL: HERO_STATS_URL,
};
