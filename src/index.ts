import pino from 'pino';
import { connectMongo } from './db/mongo.js';
import { config } from './config.js';
import { createServer } from './server.js';

const logger = pino({ name: 'main' });

async function main() {
  await connectMongo(config.mongodbUri);
  const app = createServer();
  app.listen(config.port, () => logger.info(`HTTP listening on :${config.port}`));
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
