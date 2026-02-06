# AI-Powered Job Tracker Platform

A production-grade full-stack application for intelligent job tracking with AI-powered matching and conversational assistance.

## 🏗️ Architecture

### Tech Stack
- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Backend**: Fastify + TypeScript
- **AI**: LangChain (job matching) + LangGraph (assistant orchestration)
- **Storage**: JSON-based (production-ready for PostgreSQL migration)

### Project Structure
```
job-tracker-platform/
├── frontend/              # Next.js application
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities & API client
│   │   └── types/        # TypeScript definitions
│   └── package.json
├── backend/              # Fastify API server
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── ai/           # LangChain & LangGraph
│   │   └── data/         # JSON storage
│   └── package.json
└── README.md
```

## 🤖 AI Architecture

### LangChain Job Matching
**Flow**:
1. Parse resume text to extract skills, experience, keywords
2. For each job, create embeddings of job description + requirements
3. Compare resume profile against job using:
   - Semantic similarity (cosine)
   - Keyword matching (weighted)
   - Experience level alignment
4. Generate 0-100 match score with explanation

**Score Calculation**:
- Skills overlap: 40%
- Experience relevance: 30%
- Keyword density: 20%
- Job level fit: 10%

**Color Coding**:
- 🟢 Green (>70): Strong match - high compatibility
- 🟡 Yellow (40-70): Medium match - partial fit
- ⚪ Gray (<40): Low match - significant gaps

### LangGraph Assistant Architecture

**Graph Nodes**:
```
Start → Intent Detection → Router → [Actions] → Response → End
                              ↓
                    ┌─────────┼─────────┐
                    ↓         ↓         ↓
              Job Search  Filter Update  Help
```

**Node Descriptions**:

1. **Intent Detection Node**
   - Analyzes user message
   - Classifies into: search_jobs | update_filters | help | general_chat
   - Extracts parameters (skills, location, remote, etc.)

2. **Router Node**
   - Routes to appropriate action based on intent
   - Maintains conversation context

3. **Action Nodes**:
   - **Job Search**: Query jobs with natural language
   - **Filter Update**: Directly manipulate frontend filters (key feature!)
   - **Help**: Answer product questions

4. **Response Generator**
   - Formats action results into natural language
   - Includes filter state changes for frontend updates

**Filter Control Examples**:
```
User: "Show only remote jobs"
→ Intent: update_filters
→ Action: {workMode: ['remote']}
→ Frontend receives filter update and applies immediately

User: "I want high match scores only"
→ Intent: update_filters  
→ Action: {matchScore: 'high'}
→ UI updates to show only >70% matches
```

## 🎨 UX Decisions

### 1. **Application Tracking Flow**
- External job links open in new tab
- On return (window focus), intelligent popup asks about application
- Three-option dialog reduces friction vs binary yes/no
- Status timeline provides visual progress tracking

### 2. **Smart Filtering**
- Instant filter application (no "Apply" button needed)
- Clear visual indicators for active filters
- "Clear All" button always accessible
- Match score filter with visual color coding

### 3. **AI Assistant Interface**
- Floating chat bubble: unobtrusive, always accessible
- Expandable sidebar: better for longer conversations
- Direct filter manipulation: assistant actions immediately reflected in UI
- Typing indicators and smooth animations

### 4. **Resume Management**
- Single resume per user (enterprise can extend to multiple)
- Easy replace/update flow
- Text extraction preview before save
- Automatic re-matching on resume update

### 5. **Best Matches Section**
- Top 6-8 jobs prominently displayed
- Explanation cards show WHY it's a good match
- Quick apply from best matches
- Refreshes when filters change

## 📊 Scalability Notes

### Current Architecture (MVP)
- JSON file storage for rapid prototyping
- In-memory job matching (fast for <1000 jobs)
- Stateless backend (easy horizontal scaling)

### Production Migration Path

**Database**: JSON → PostgreSQL/MongoDB
```typescript
// Current
const jobs = readJSONFile('jobs.json')

// Production
const jobs = await db.query('SELECT * FROM jobs WHERE ...')
```

**Caching**: Add Redis for:
- Frequently accessed jobs
- Pre-computed match scores
- Session management

**Job Fetching**: Mock API → Real job boards
- Integrate with LinkedIn, Indeed, GitHub Jobs APIs
- Scheduled sync jobs (cron/worker)
- Deduplication logic

**AI Optimization**:
- Batch matching (process 100 jobs at once)
- Vector database (Pinecone/Weaviate) for semantic search
- Cache LLM responses for identical queries
- Use smaller models for intent detection (cost reduction)

**Authentication**:
- Currently: Hardcoded test user
- Production: JWT tokens, OAuth, session management
- User profile database with encrypted resume storage

**File Storage**:
- Local filesystem → S3/GCS/Azure Blob
- CDN for resume delivery
- Virus scanning for uploaded files

**Monitoring**:
- Application Performance Monitoring (APM)
- AI usage tracking (tokens, latency)
- Error tracking (Sentry)
- User analytics

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm/yarn/pnpm

### Environment Variables

**Backend** (`backend/.env`):
```env
PORT=3001
OPENAI_API_KEY=your_openai_api_key_here
NODE_ENV=development
```

**Frontend** (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Installation & Running

**Terminal 1 - Backend**:
```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:3001
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3000
```

### Login Credentials
```
Email: test@gmail.com
Password: test@123
```

## 🔧 Development

### Adding New Job Sources
Edit `backend/src/services/jobService.ts`:
```typescript
async fetchJobsFromAPI() {
  // Replace mock data with real API calls
  const response = await fetch('https://api.jobboard.com/jobs')
  return response.json()
}
```

### Customizing Match Algorithm
Edit `backend/src/ai/jobMatcher.ts`:
```typescript
// Adjust weights
const skillsWeight = 0.4  // 40%
const experienceWeight = 0.3  // 30%
const keywordWeight = 0.2  // 20%
const levelWeight = 0.1  // 10%
```

### Extending AI Assistant
Add nodes to `backend/src/ai/assistantGraph.ts`:
```typescript
const graph = new StateGraph({
  // Add custom nodes
  scheduleInterview: scheduleInterviewNode,
  generateCoverLetter: coverLetterNode,
})
```

## 📦 Build for Production

**Frontend**:
```bash
cd frontend
npm run build
npm start
```

**Backend**:
```bash
cd backend
npm run build
npm start
```

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 API Documentation

### Key Endpoints

**Authentication**:
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

**Jobs**:
- `GET /api/jobs` - Get all jobs with filters
- `GET /api/jobs/:id` - Get single job

**Resume**:
- `POST /api/resume/upload` - Upload resume
- `GET /api/resume` - Get user's resume
- `DELETE /api/resume` - Delete resume

**Matching**:
- `GET /api/matches` - Get matched jobs with scores
- `GET /api/matches/best` - Get top matches

**Applications**:
- `POST /api/applications` - Create application
- `GET /api/applications` - Get user's applications
- `PATCH /api/applications/:id` - Update status

**AI Assistant**:
- `POST /api/assistant/chat` - Send message to assistant
- `GET /api/assistant/conversation` - Get conversation history

## 🎯 Feature Completeness

✅ Job Feed with external API integration (mock)
✅ All filters working (role, skills, date, type, mode, location, match score)
✅ Resume upload (PDF/TXT) with text extraction
✅ AI job matching with LangChain (0-100 scores)
✅ Color-coded match badges (green/yellow/gray)
✅ Best Matches section with explanations
✅ Smart application tracking with popup
✅ Application status timeline
✅ AI assistant with LangGraph orchestration
✅ Natural language job search
✅ Direct filter control from assistant
✅ Product help from assistant
✅ Mobile-responsive UI
✅ Modern, clean design with animations

## 🔐 Security Considerations

**Production Checklist**:
- [ ] Replace hardcoded credentials with proper auth
- [ ] Add rate limiting
- [ ] Implement CORS properly
- [ ] Sanitize all user inputs
- [ ] Encrypt resume files
- [ ] Use environment variables for all secrets
- [ ] Add HTTPS
- [ ] Implement CSRF protection
- [ ] Add content security policy
- [ ] Regular dependency updates

## 📞 Support

For issues or questions:
1. Check this README
2. Review code comments
3. Ask the AI assistant within the app!

---

**Built with ❤️ using Next.js, Fastify, LangChain & LangGraph**
