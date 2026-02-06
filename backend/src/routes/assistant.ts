import { FastifyInstance } from 'fastify';
import { AssistantService } from '../services/assistantService';

export async function assistantRoutes(fastify: FastifyInstance) {
  const assistantService = new AssistantService();

  fastify.post('/api/assistant/chat', async (request, reply) => {
    const userId = request.headers['authorization']?.replace('Bearer ', '');

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const { message } = request.body as { message: string };

    if (!message) {
      return reply.code(400).send({ error: 'Message required' });
    }

    try {
      const result = await assistantService.processMessage(userId, message);
      return result;
    } catch (error: any) {
      console.error('Assistant error:', error);
      return reply.code(500).send({ 
        error: 'Failed to process message',
        response: "I'm having trouble processing that. Please try again!" 
      });
    }
  });

  fastify.get('/api/assistant/conversation', async (request, reply) => {
    const userId = request.headers['authorization']?.replace('Bearer ', '');

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    const conversation = await assistantService.getConversation(userId);
    return { conversation };
  });

  fastify.delete('/api/assistant/conversation', async (request, reply) => {
    const userId = request.headers['authorization']?.replace('Bearer ', '');

    if (!userId) {
      return reply.code(401).send({ error: 'Unauthorized' });
    }

    await assistantService.clearConversation(userId);
    return { message: 'Conversation cleared' };
  });
}
