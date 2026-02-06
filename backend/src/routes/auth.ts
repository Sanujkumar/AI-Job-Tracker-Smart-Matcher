import { FastifyInstance } from 'fastify';
import { AuthService } from '../services/authService';

export async function authRoutes(fastify: FastifyInstance) {
  const authService = new AuthService();

  fastify.post('/api/auth/login', async (request, reply) => {
    const { email, password } = request.body as { email: string; password: string };

    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password required' });
    }

    const user = await authService.login(email, password);

    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    return { user, token: user.id }; // Simplified auth token
  });

  fastify.post('/api/auth/logout', async (request, reply) => {
    return { message: 'Logged out successfully' };
  });

  fastify.get('/api/auth/me', async (request, reply) => {
    const userId = request.headers['authorization']?.replace('Bearer ', '');

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const user = await authService.getUser(userId);

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return { user };
  });
}
