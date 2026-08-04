import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import environment from './config/env.js';

async function startServer() {
  await connectDatabase();
  app.listen(environment.PORT, () => {
    console.log(`TMS API is listening on port ${environment.PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Unable to start TMS API:', error);
  process.exit(1);
});
