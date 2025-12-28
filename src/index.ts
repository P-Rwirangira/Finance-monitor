import pino from 'pino';
import { connectMongo } from './db/mongo.js';
import { config } from './config.js';
import { createServer } from './server.js';

const logger = pino({ name: 'main' });

async function main() {
  await connectMongo(config.mongodbUri);
  const app = createServer();
  const server = app.listen(config.port, () => logger.info(`HTTP listening on :${config.port}`));

  let shuttingDown = false;
  const graceful = (signal: NodeJS.Signals) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'graceful shutdown start');
    const timeout = setTimeout(() => {
      logger.error('Force exiting after 10s');
      process.exit(1);
    }, 10000);
    timeout.unref();

    server.close(async (err?: Error) => {
      if (err) logger.error({ err }, 'error closing server');
      try {
        const { disconnectMongo } = await import('./db/mongo.js');
        await disconnectMongo();
        logger.info('Disconnected MongoDB');
      } catch (e) {
        logger.error({ e }, 'Error disconnecting MongoDB');
      } finally {
        logger.info('Shutdown complete');
        process.exit(0);
      }
    });
  };

  process.on('SIGINT', graceful);
  process.on('SIGTERM', graceful);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
