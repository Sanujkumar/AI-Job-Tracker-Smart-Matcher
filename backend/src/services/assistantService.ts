import { readJSON, writeJSON } from '../utils/storage';
import { ConversationState, AssistantMessage, FilterUpdate } from '../types';
import { AssistantGraph } from '../ai/assistantGraph';

export class AssistantService {
  private readonly CONVERSATIONS_FILE = 'conversations.json';
  private graph: AssistantGraph;

  constructor() {
    this.graph = new AssistantGraph();
  }

  async processMessage(
    userId: string,
    message: string
  ): Promise<{
    response: string;
    filterUpdate?: FilterUpdate;
  }> {
    // Get or create conversation state
    const conversations = readJSON<Record<string, ConversationState>>(this.CONVERSATIONS_FILE);
    
    let state = conversations[userId];
    if (!state) {
      state = {
        userId,
        messages: [],
        currentFilters: {},
        context: {}
      };
    }

    // Process message through LangGraph
    const result = await this.graph.processMessage(userId, message, state);

    // Update conversation state
    const userMessage: AssistantMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    const assistantMessage: AssistantMessage = {
      role: 'assistant',
      content: result.response,
      timestamp: new Date().toISOString(),
      filterUpdate: result.filterUpdate
    };

    state.messages.push(userMessage, assistantMessage);

    // Update current filters if there's an update
    if (result.filterUpdate) {
      state.currentFilters = { ...state.currentFilters, ...result.filterUpdate };
    }

    // Save state
    conversations[userId] = state;
    writeJSON(this.CONVERSATIONS_FILE, conversations);

    return result;
  }

  async getConversation(userId: string): Promise<ConversationState> {
    const conversations = readJSON<Record<string, ConversationState>>(this.CONVERSATIONS_FILE);
    
    return conversations[userId] || {
      userId,
      messages: [],
      currentFilters: {},
      context: {}
    };
  }

  async clearConversation(userId: string): Promise<void> {
    const conversations = readJSON<Record<string, ConversationState>>(this.CONVERSATIONS_FILE);
    
    if (conversations[userId]) {
      conversations[userId] = {
        userId,
        messages: [],
        currentFilters: {},
        context: {}
      };
      writeJSON(this.CONVERSATIONS_FILE, conversations);
    }
  }
}
