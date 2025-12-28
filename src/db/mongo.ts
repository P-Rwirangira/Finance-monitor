import mongoose from 'mongoose';
import pino from 'pino';

const logger = pino({ name: 'mongo' });

export async function connectMongo(uri: string) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  } as any);
  logger.info('Connected to MongoDB');
}

export async function disconnectMongo() {
  await mongoose.disconnect();
}
