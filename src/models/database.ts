import { PrismaClient } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';
import { logger } from '../utils/logger';

// Create Prisma adapter with database URL
const adapter = new PrismaLibSql({
  url: 'file:./data/notes.db',
});

// Create Prisma client with adapter
export const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

// Log Prisma queries to Winston
prisma.$on('query', (e: any) => {
  logger.debug('Prisma Query', { query: e.query, params: e.params, duration: e.duration });
});

prisma.$on('error', (e: any) => {
  logger.error('Prisma Error', { message: e.message });
});

prisma.$on('warn', (e: any) => {
  logger.warn('Prisma Warning', { message: e.message });
});

export const initializeDatabase = async () => {
  try {
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error: any) {
    logger.error('Failed to connect to database', { error: error.message });
    throw error;
  }
};

export const closeDatabase = async () => {
  await prisma.$disconnect();
  logger.info('Database connection closed');
};
