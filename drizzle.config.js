import 'dotenv/config';
import { neonConfig } from '@neondatabase/serverless';

// For Neon Local, configure to use HTTP connection
if (process.env.DATABASE_URL?.includes('neon-local')) {
  neonConfig.fetchEndpoint = 'http://neon-local:5432';
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

export default {
  schema: './src/models/*.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  // For Neon Local, we might need to use a different driver
  // But drizzle-kit migrate requires postgres driver, so we need the actual Neon connection
};
