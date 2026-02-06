import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { StateGraph, END } from '@langchain/langgraph';
import { AssistantIntent, ConversationState, FilterUpdate, AssistantMessage } from '../types';

interface GraphState {
  messages: AssistantMessage[];
  intent?: AssistantIntent;
  response?: string;
  filterUpdate?: FilterUpdate;
  currentFilters: FilterUpdate;
  userId: string;
}

export class AssistantGraph {
  private llm: ChatOpenAI;
  private graph: any;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.7,
    });

    this.graph = this.buildGraph();
  }

  /**
   * Build LangGraph workflow
   */
  private buildGraph() {
    const workflow = new StateGraph<GraphState>({
      channels: {
        messages: {
          value: (left: AssistantMessage[], right: AssistantMessage[]) => right,
          default: () => []
        },
        intent: {
          value: (left?: AssistantIntent, right?: AssistantIntent) => right || left,
        },
        response: {
          value: (left?: string, right?: string) => right || left,
        },
        filterUpdate: {
          value: (left?: FilterUpdate, right?: FilterUpdate) => right || left,
        },
        currentFilters: {
          value: (left: FilterUpdate, right: FilterUpdate) => ({ ...left, ...right }),
          default: () => ({})
        },
        userId: {
          value: (left: string, right: string) => right || left,
          default: () => ''
        }
      }
    });

    // Define nodes
    workflow.addNode('detectIntent', this.detectIntentNode.bind(this));
    workflow.addNode('routeAction', this.routeActionNode.bind(this));
    workflow.addNode('searchJobs', this.searchJobsNode.bind(this));
    workflow.addNode('updateFilters', this.updateFiltersNode.bind(this));
    workflow.addNode('provideHelp', this.provideHelpNode.bind(this));
    workflow.addNode('generalChat', this.generalChatNode.bind(this));
    workflow.addNode('generateResponse', this.generateResponseNode.bind(this));

    // Define edges
    workflow.addEdge('__start__', 'detectIntent');
    workflow.addEdge('detectIntent', 'routeAction');
    
    // Conditional routing based on intent
    workflow.addConditionalEdges(
      'routeAction',
      (state: GraphState) => state.intent?.type || 'general_chat',
      {
        'search_jobs': 'searchJobs',
        'update_filters': 'updateFilters',
        'help': 'provideHelp',
        'general_chat': 'generalChat'
      }
    );

    // All actions lead to response generation
    workflow.addEdge('searchJobs', 'generateResponse');
    workflow.addEdge('updateFilters', 'generateResponse');
    workflow.addEdge('provideHelp', 'generateResponse');
    workflow.addEdge('generalChat', 'generateResponse');
    workflow.addEdge('generateResponse', END);

    return workflow.compile();
  }

  /**
   * Node 1: Detect user intent
   */
  private async detectIntentNode(state: GraphState): Promise<Partial<GraphState>> {
    const lastMessage = state.messages[state.messages.length - 1];
    
    const prompt = PromptTemplate.fromTemplate(`
Analyze the user's message and determine their intent.

User message: "{message}"

Classify into ONE of these intents:
1. search_jobs - User wants to find/search for jobs (e.g., "show me frontend jobs", "find remote positions")
2. update_filters - User wants to change active filters (e.g., "show only remote", "filter by high match", "clear filters")
3. help - User has questions about the platform (e.g., "how does matching work?", "what features do you have?")
4. general_chat - General conversation or unclear intent

Extract parameters based on intent:
- For search_jobs: {{role, skills, location, remote}}
- For update_filters: {{workMode, matchScore, jobType, skills, location, action}}

Respond ONLY with valid JSON in this format:
{{
  "type": "intent_type",
  "parameters": {{}},
  "confidence": 0.0-1.0
}}
    `);

    try {
      const chain = prompt.pipe(this.llm);
      const result = await chain.invoke({
        message: lastMessage.content
      });

      const intentData = JSON.parse(result.content.toString().trim());
      
      const intent: AssistantIntent = {
        type: intentData.type,
        parameters: intentData.parameters || {},
        confidence: intentData.confidence || 0.8
      };

      return { intent };
    } catch (error) {
      console.error('Intent detection error:', error);
      return {
        intent: {
          type: 'general_chat',
          parameters: {},
          confidence: 0.5
        }
      };
    }
  }

  /**
   * Node 2: Route to appropriate action (pass-through)
   */
  private async routeActionNode(state: GraphState): Promise<Partial<GraphState>> {
    // This is a pass-through node; actual routing happens in conditional edges
    return {};
  }

  /**
   * Node 3a: Search jobs action
   */
  private async searchJobsNode(state: GraphState): Promise<Partial<GraphState>> {
    const params = state.intent?.parameters || {};
    
    // Convert natural language to filter updates
    const filterUpdate: FilterUpdate = {};
    
    if (params.role) filterUpdate.role = params.role;
    if (params.skills) filterUpdate.skills = Array.isArray(params.skills) ? params.skills : [params.skills];
    if (params.location) filterUpdate.location = params.location;
    if (params.remote) filterUpdate.workMode = ['remote'];

    return {
      filterUpdate,
      response: `Searching for ${params.role || 'jobs'}...`
    };
  }

  /**
   * Node 3b: Update filters action
   */
  private async updateFiltersNode(state: GraphState): Promise<Partial<GraphState>> {
    const params = state.intent?.parameters || {};
    const filterUpdate: FilterUpdate = {};

    // Handle clear all filters
    if (params.action === 'clear' || params.clear === true) {
      return {
        filterUpdate: {
          role: '',
          skills: [],
          datePosted: 'anytime',
          jobType: [],
          workMode: [],
          location: '',
          matchScore: 'all'
        },
        response: 'All filters cleared!'
      };
    }

    // Work mode filters
    if (params.workMode) {
      const modes = Array.isArray(params.workMode) ? params.workMode : [params.workMode];
      filterUpdate.workMode = modes.map((m: string) => {
        const lower = m.toLowerCase();
        if (lower.includes('remote')) return 'remote';
        if (lower.includes('hybrid')) return 'hybrid';
        if (lower.includes('onsite') || lower.includes('office')) return 'onsite';
        return m;
      });
    }

    // Match score filter
    if (params.matchScore) {
      const score = params.matchScore.toLowerCase();
      if (score.includes('high') || score.includes('best')) {
        filterUpdate.matchScore = 'high';
      } else if (score.includes('medium') || score.includes('moderate')) {
        filterUpdate.matchScore = 'medium';
      } else {
        filterUpdate.matchScore = 'all';
      }
    }

    // Job type filter
    if (params.jobType) {
      const types = Array.isArray(params.jobType) ? params.jobType : [params.jobType];
      filterUpdate.jobType = types.map((t: string) => {
        const lower = t.toLowerCase();
        if (lower.includes('full')) return 'full-time';
        if (lower.includes('part')) return 'part-time';
        if (lower.includes('contract')) return 'contract';
        if (lower.includes('intern')) return 'internship';
        return t;
      });
    }

    // Skills filter
    if (params.skills) {
      filterUpdate.skills = Array.isArray(params.skills) ? params.skills : [params.skills];
    }

    // Location filter
    if (params.location) {
      filterUpdate.location = params.location;
    }

    return { filterUpdate };
  }

  /**
   * Node 3c: Provide help action
   */
  private async provideHelpNode(state: GraphState): Promise<Partial<GraphState>> {
    const params = state.intent?.parameters || {};
    const question = state.messages[state.messages.length - 1].content.toLowerCase();

    let helpResponse = '';

    if (question.includes('match') || question.includes('score')) {
      helpResponse = `Job matching uses AI to analyze your resume against each job posting. We score jobs 0-100 based on:
• Skills overlap (40%)
• Experience relevance (30%)
• Keyword alignment (20%)
• Job level fit (10%)

Green badges (>70) are strong matches, yellow (40-70) are moderate, and gray (<40) are lower fits.`;
    } else if (question.includes('filter')) {
      helpResponse = `You can filter jobs by role, skills, date posted, job type, work mode, location, and match score. Just tell me what you're looking for and I'll update the filters for you! Try "show only remote jobs" or "high match scores only".`;
    } else if (question.includes('apply') || question.includes('track')) {
      helpResponse = `When you click Apply, you'll be directed to the job posting. When you return, we'll ask if you applied. Your applications are tracked with statuses: Applied → Interview → Offer/Rejected. View your timeline in the Applications dashboard.`;
    } else if (question.includes('resume')) {
      helpResponse = `Upload your resume (PDF or TXT) to enable AI matching. We extract your skills and experience to score each job. You can replace your resume anytime, and all match scores will update automatically.`;
    } else {
      helpResponse = `I'm your AI job search assistant! I can:
• Search for jobs using natural language
• Update filters (e.g., "show remote only", "high matches")
• Answer questions about features
• Help you find the best opportunities

What would you like to do?`;
    }

    return { response: helpResponse };
  }

  /**
   * Node 3d: General chat action
   */
  private async generalChatNode(state: GraphState): Promise<Partial<GraphState>> {
    const prompt = PromptTemplate.fromTemplate(`
You are a helpful AI assistant for a job tracking platform.

User: {message}

Provide a brief, friendly response. If the user's intent is unclear, ask clarifying questions or suggest what you can help with.
Keep responses under 3 sentences.
    `);

    try {
      const chain = prompt.pipe(this.llm);
      const result = await chain.invoke({
        message: state.messages[state.messages.length - 1].content
      });

      return { response: result.content.toString().trim() };
    } catch (error) {
      return {
        response: "I'm here to help! Try asking me to search for jobs, update filters, or answer questions about the platform."
      };
    }
  }

  /**
   * Node 4: Generate final response
   */
  private async generateResponseNode(state: GraphState): Promise<Partial<GraphState>> {
    // If we have a filter update, enhance the response
    if (state.filterUpdate && Object.keys(state.filterUpdate).length > 0) {
      const updates = Object.entries(state.filterUpdate)
        .filter(([_, value]) => value !== undefined && value !== '' && (Array.isArray(value) ? value.length > 0 : true))
        .map(([key, value]) => {
          if (Array.isArray(value)) return `${key}: ${value.join(', ')}`;
          return `${key}: ${value}`;
        });

      if (updates.length > 0) {
        const filterResponse = `Filters updated: ${updates.join(', ')}`;
        return {
          response: state.response ? `${state.response}\n\n${filterResponse}` : filterResponse
        };
      }
    }

    return { response: state.response || "I'm processing your request..." };
  }

  /**
   * Execute the graph with user input
   */
  async processMessage(
    userId: string,
    message: string,
    conversationState: ConversationState
  ): Promise<{
    response: string;
    filterUpdate?: FilterUpdate;
  }> {
    const userMessage: AssistantMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    const initialState: GraphState = {
      messages: [...conversationState.messages, userMessage],
      currentFilters: conversationState.currentFilters || {},
      userId
    };

    try {
      const result = await this.graph.invoke(initialState);

      return {
        response: result.response || "I'm not sure how to help with that. Try asking about jobs, filters, or features!",
        filterUpdate: result.filterUpdate
      };
    } catch (error) {
      console.error('Graph execution error:', error);
      return {
        response: "I encountered an error processing your request. Please try again!"
      };
    }
  }
}
