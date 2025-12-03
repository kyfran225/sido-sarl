import mongoose from 'mongoose';
import logger from '../config/logger.js';

const MONGO_URI = process.env.MONGO_URI;

export const connectDB = async () => {
  if (!MONGO_URI) {
    throw new Error('MONGO_URI non défini');
  }
  mongoose.set('strictQuery', true);
  await mongoose.connect(MONGO_URI, {
    serverSelectionTimeoutMS: 5000
  });
  logger.info('Connexion MongoDB établie');
};

export default mongoose;
