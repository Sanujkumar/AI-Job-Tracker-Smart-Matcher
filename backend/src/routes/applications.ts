import { FastifyInstance } from 'fastify';
import { ApplicationService } from '../services/applicationService';
import { JobService } from '../services/jobService';

export async function applicationRoutes(fastify: FastifyInstance) {
  const applicationService = new ApplicationService();
  const jobService = new JobService();

  fastify.post('/api/applications', async (request, reply) => {
    const userId = request.headers['authorization']?.replace('Bearer ', '');

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { jobId, status, notes } = request.body as {
      jobId: string;
      status?: 'applied' | 'interview' | 'offer' | 'rejected';
      notes?: string;
    };

    if (!jobId) {
      return reply.code(400).send({ error: 'Job ID required' });
    }

    // Check if job exists
    const job = await jobService.getJobById(jobId);
    if (!job) {
      return reply.code(404).send({ error: 'Job not found' });
    }

    // Check if application already exists
    const existing = await applicationService.getApplicationByJob(userId, jobId);
    if (existing) {
      return reply.code(400).send({ error: 'Application already exists for this job' });
    }

    const application = await applicationService.createApplication(
      userId,
      jobId,
      status,
      notes
    );

    return { application };
  });

  fastify.get('/api/applications', async (request, reply) => {
    const userId = request.headers['authorization']?.replace('Bearer ', '');

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const applications = await applicationService.getApplications(userId);

    // Get job details for each application
    const jobIds = applications.map(app => app.jobId);
    const jobs = await jobService.getJobsByIds(jobIds);
    
    const applicationsWithJobs = applications.map(app => ({
      ...app,
      job: jobs.find(j => j.id === app.jobId)
    }));

    return { applications: applicationsWithJobs, count: applications.length };
  });

  fastify.get('/api/applications/:id', async (request, reply) => {
    const userId = request.headers['authorization']?.replace('Bearer ', '');
    const { id } = request.params as { id: string };

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const application = await applicationService.getApplication(id);

    if (!application || application.userId !== userId) {
      return reply.code(404).send({ error: 'Application not found' });
    }

    const job = await jobService.getJobById(application.jobId);

    return { application: { ...application, job } };
  });

  fastify.patch('/api/applications/:id', async (request, reply) => {
    const userId = request.headers['authorization']?.replace('Bearer ', '');
    const { id } = request.params as { id: string };
    const { status, note } = request.body as {
      status: 'applied' | 'interview' | 'offer' | 'rejected';
      note?: string;
    };

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    if (!status) {
      return reply.code(400).send({ error: 'Status required' });
    }

    const application = await applicationService.getApplication(id);

    if (!application || application.userId !== userId) {
      return reply.code(404).send({ error: 'Application not found' });
    }

    const updated = await applicationService.updateStatus(id, status, note);

    return { application: updated };
  });

  fastify.delete('/api/applications/:id', async (request, reply) => {
    const userId = request.headers['authorization']?.replace('Bearer ', '');
    const { id } = request.params as { id: string };

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const application = await applicationService.getApplication(id);

    if (!application || application.userId !== userId) {
      return reply.code(404).send({ error: 'Application not found' });
    }

    await applicationService.deleteApplication(id);

    return { message: 'Application deleted successfully' };
  });
}
