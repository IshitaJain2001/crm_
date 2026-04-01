/**
 * Backend API origin (no trailing slash).
 * Production: set REACT_APP_API_URL in the hosting dashboard or .env.production.
 * Local: defaults to backend on port 5000; override with .env or .env.development.local.
 */
export const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";
