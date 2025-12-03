import dotenv from 'dotenv';
import http from 'node:http';
import app from './loaders/app.js';
import { connectDB } from './loaders/db.js';
import logger from './config/logger.js';

dotenv.config();

const PORT = process.env.PORT || 4000;

(async () => {
  try {
    await connectDB();
    const server = http.createServer(app);
    server.listen(PORT, () => {
      logger.info({ port: PORT }, 'API SIDO Points Verts démarrée');
    });
  } catch (error) {
    logger.error({ err: error }, 'Échec démarrage serveur');
    process.exit(1);
  }
})();
