import { FastifyInstance } from 'fastify';
import { ResumeService } from '../services/resumeService';

export async function resumeRoutes(fastify: FastifyInstance) {
  const resumeService = new ResumeService();

  fastify.post('/api/resume/upload', async (request, reply) => {
    const userId = request.headers['authorization']?.replace('Bearer ', '');

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const data = await request.file();

    if (!data) {
      return reply.code(400).send({ error: 'No file uploaded' });
    }

    const buffer = await data.toBuffer();
    const filename = data.filename;

    try {
      const resume = await resumeService.uploadResume(userId, buffer, filename);
      return { resume };
    } catch (error: any) {
      return reply.code(400).send({ error: error.message });
    }
  });

  fastify.get('/api/resume', async (request, reply) => {
    const userId = request.headers['authorization']?.replace('Bearer ', '');

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const resume = await resumeService.getResume(userId);

    if (!resume) {
      return reply.code(404).send({ error: 'Resume not found' });
    }

    return { resume };
  });

  fastify.delete('/api/resume', async (request, reply) => {
    const userId = request.headers['authorization']?.replace('Bearer ', '');

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const deleted = await resumeService.deleteResume(userId);

    if (!deleted) {
      return reply.code(404).send({ error: 'Resume not found' });
    }

    return { message: 'Resume deleted successfully' };
  });
}
