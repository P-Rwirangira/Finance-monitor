import { connectMongo } from './db/mongo.js';
import { config } from './config.js';
import { runGmailIngestion } from './pipeline/ingest_gmail.js';
import pino from 'pino';

const logger = pino({ name: 'run_ingest' });

async function main() {
  await connectMongo(config.mongodbUri);
  try {
    await runGmailIngestion();
    logger.info('Ingestion complete');
    process.exitCode = 0;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exitCode = 1;
  } finally {
    const { disconnectMongo } = await import('./db/mongo.js');
    try {
      await disconnectMongo();
      logger.info('MongoDB disconnected');
    } catch (err) {
      logger.error({ err }, 'Error disconnecting MongoDB');
    } finally {
      process.exit();
    }
  }
}

main();
