import mongoose from 'mongoose';
import pino from 'pino';

const logger = pino({ name: 'mongo' });

export async function connectMongo(uri: string) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  logger.info('Connected to MongoDB');
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}
