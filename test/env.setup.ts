// GitHub Actions sets CI=true and its own database. Locally, force the
// throwaway database even when the shell already loaded backend/.env.
if (!process.env.CI) {
  process.env.DB_HOST = '127.0.0.1';
  process.env.DB_PORT = '5435';
  process.env.DB_USERNAME = 'postgres';
  process.env.DB_PASSWORD = 'password';
  process.env.DB_NAME = 'mcsos_test';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
  process.env.JWT_ACCESS_EXPIRES_IN = '15m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
}
process.env.NODE_ENV = 'test';
