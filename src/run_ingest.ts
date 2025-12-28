import { connectMongo } from './db/mongo.js';
import { config } from './config.js';
import { runGmailIngestion } from './pipeline/ingest_gmail.js';
import pino from 'pino';

const logger = pino({ name: 'run_ingest' });

async function main() {
  await connectMongo(config.mongodbUri);
  await runGmailIngestion();
  logger.info('Ingestion complete');
  process.exit(0);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
