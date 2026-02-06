import { FastifyInstance } from 'fastify';
import { MatchService } from '../services/matchService';
import { ResumeService } from '../services/resumeService';
import { JobService } from '../services/jobService';

export async function matchRoutes(fastify: FastifyInstance) {
  const matchService = new MatchService();
  const resumeService = new ResumeService();
  const jobService = new JobService();

  fastify.get('/api/matches', async (request, reply) => {
    const userId = request.headers['authorization']?.replace('Bearer ', '');

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { jobIds, matchScore } = request.query as {
      jobIds?: string;
      matchScore?: 'high' | 'medium' | 'all';
    };

    let matches = await matchService.getMatches(
      userId,
      jobIds ? jobIds.split(',') : undefined
    );

    // Filter by match score
    if (matchScore === 'high') {
      matches = matches.filter(m => m.score > 70);
    } else if (matchScore === 'medium') {
      matches = matches.filter(m => m.score >= 40 && m.score <= 70);
    }

    return { matches, count: matches.length };
  });

  fastify.get('/api/matches/best', async (request, reply) => {
    const userId = request.headers['authorization']?.replace('Bearer ', '');

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { limit } = request.query as { limit?: string };
    const matches = await matchService.getBestMatches(
      userId,
      limit ? parseInt(limit) : 8
    );

    return { matches, count: matches.length };
  });

  fastify.post('/api/matches/calculate', async (request, reply) => {
    const userId = request.headers['authorization']?.replace('Bearer ', '');

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    // Get resume
    const resume = await resumeService.getResume(userId);
    if (!resume) {
      return reply.code(404).send({ error: 'Resume not found. Please upload a resume first.' });
    }

    // Get jobs (apply same filters as job list)
    const { 
      role, 
      skills, 
      datePosted, 
      jobType, 
      workMode, 
      location 
    } = request.query as any;

    const filters: any = {};
    if (role) filters.role = role;
    if (skills) filters.skills = skills.split(',');
    if (datePosted) filters.datePosted = datePosted;
    if (jobType) filters.jobType = jobType.split(',');
    if (workMode) filters.workMode = workMode.split(',');
    if (location) filters.location = location;

    const jobs = await jobService.getAllJobs(filters);

    // Calculate matches
    const matches = await matchService.calculateMatches(userId, resume, jobs);

    return { 
      matches, 
      count: matches.length,
      message: 'Matches calculated successfully'
    };
  });
}
