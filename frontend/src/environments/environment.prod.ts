/**
 * Production build. By default the API is expected on the same origin
 * (e.g. a reverse proxy forwarding `/api/` to Django). Change to an absolute
 * URL if the backend is hosted on a separate domain.
 */
export const environment = {
  production: true,
  apiUrl: '/api',
};
