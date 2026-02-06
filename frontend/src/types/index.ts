export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface Resume {
  userId: string;
  filename: string;
  uploadedAt: string;
  extractedText: string;
  skills: string[];
  experience: string[];
  keywords: string[];
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  skills: string[];
  jobType: 'full-time' | 'part-time' | 'contract' | 'internship';
  workMode: 'remote' | 'hybrid' | 'onsite';
  postedDate: string;
  applyUrl: string;
  salary?: string;
}

export interface MatchScore {
  jobId: string;
  userId: string;
  score: number;
  explanation: {
    matchingSkills: string[];
    relevantExperience: string[];
    keywordAlignment: string[];
    overallReason: string;
  };
  calculatedAt: string;
}

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: 'applied' | 'interview' | 'offer' | 'rejected';
  appliedAt: string;
  notes?: string;
  timeline: TimelineEvent[];
  job?: Job;
}

export interface TimelineEvent {
  status: Application['status'];
  date: string;
  note?: string;
}

export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  filterUpdate?: FilterUpdate;
}

export interface FilterUpdate {
  role?: string;
  skills?: string[];
  datePosted?: '24h' | 'week' | 'month' | 'anytime';
  jobType?: Job['jobType'][];
  workMode?: Job['workMode'][];
  location?: string;
  matchScore?: 'high' | 'medium' | 'all';
}

export interface Filters extends FilterUpdate {}
