import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import dotenv from 'dotenv';
import { authRoutes } from './routes/auth';
import { jobRoutes } from './routes/jobs';
import { resumeRoutes } from './routes/resume';
import { matchRoutes } from './routes/matches';
import { applicationRoutes } from './routes/applications';
import { assistantRoutes } from './routes/assistant';
import { AuthService } from './services/authService';
import { JobService } from './services/jobService';

dotenv.config();

const fastify = Fastify({
  logger: true
});

// Register plugins
fastify.register(cors, {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
});

fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Initialize data
const authService = new AuthService();
const jobService = new JobService();

authService.initializeTestUser();
jobService.initializeJobs();

// Register routes
fastify.register(authRoutes);
fastify.register(jobRoutes);
fastify.register(resumeRoutes);
fastify.register(matchRoutes);
fastify.register(applicationRoutes);
fastify.register(assistantRoutes);

// Health check
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3001');
    await fastify.listen({ port, host: '0.0.0.0' });
    
    console.log(`🚀 Server running on http://localhost:${port}`);
    console.log(`📊 Health check: http://localhost:${port}/health`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
