import { FastifyInstance } from 'fastify';
import { JobService } from '../services/jobService';
import { Job } from '../types';

export async function jobRoutes(fastify: FastifyInstance) {
  const jobService = new JobService();

  fastify.get('/api/jobs', async (request, reply) => {
    const { 
      role, 
      skills, 
      datePosted, 
      jobType, 
      workMode, 
      location 
    } = request.query as {
      role?: string;
      skills?: string;
      datePosted?: '24h' | 'week' | 'month' | 'anytime';
      jobType?: string;
      workMode?: string;
      location?: string;
    };

    const filters: any = {};

    if (role) filters.role = role;
    if (skills) filters.skills = skills.split(',');
    if (datePosted) filters.datePosted = datePosted;
    if (jobType) filters.jobType = jobType.split(',') as Job['jobType'][];
    if (workMode) filters.workMode = workMode.split(',') as Job['workMode'][];
    if (location) filters.location = location;

    const jobs = await jobService.getAllJobs(filters);

    return { jobs, count: jobs.length };
  });

  fastify.get('/api/jobs/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const job = await jobService.getJobById(id);

    if (!job) {
      return reply.code(404).send({ error: 'Job not found' });
    }

    return { job };
  });
}
