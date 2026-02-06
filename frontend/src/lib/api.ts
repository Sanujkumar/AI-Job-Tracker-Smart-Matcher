import axios from 'axios';
import { User, Job, Resume, MatchScore, Application, AssistantMessage, Filters } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    return data;
  },
  logout: async () => {
    const { data } = await api.post('/api/auth/logout');
    return data;
  },
  getMe: async () => {
    const { data } = await api.get('/api/auth/me');
    return data;
  },
};

// Jobs
export const jobsApi = {
  getJobs: async (filters?: Partial<Filters>) => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.skills?.length) params.append('skills', filters.skills.join(','));
    if (filters?.datePosted) params.append('datePosted', filters.datePosted);
    if (filters?.jobType?.length) params.append('jobType', filters.jobType.join(','));
    if (filters?.workMode?.length) params.append('workMode', filters.workMode.join(','));
    if (filters?.location) params.append('location', filters.location);

    const { data } = await api.get(`/api/jobs?${params.toString()}`);
    return data;
  },
  getJob: async (id: string) => {
    const { data } = await api.get(`/api/jobs/${id}`);
    return data;
  },
};

// Resume
export const resumeApi = {
  upload: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post('/api/resume/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  get: async () => {
    const { data } = await api.get('/api/resume');
    return data;
  },
  delete: async () => {
    const { data } = await api.delete('/api/resume');
    return data;
  },
};

// Matches
export const matchesApi = {
  getMatches: async (filters?: { jobIds?: string[]; matchScore?: 'high' | 'medium' | 'all' }) => {
    const params = new URLSearchParams();
    if (filters?.jobIds?.length) params.append('jobIds', filters.jobIds.join(','));
    if (filters?.matchScore) params.append('matchScore', filters.matchScore);

    const { data } = await api.get(`/api/matches?${params.toString()}`);
    return data;
  },
  getBestMatches: async (limit: number = 8) => {
    const { data } = await api.get(`/api/matches/best?limit=${limit}`);
    return data;
  },
  calculateMatches: async (filters?: Partial<Filters>) => {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    if (filters?.skills?.length) params.append('skills', filters.skills.join(','));
    if (filters?.datePosted) params.append('datePosted', filters.datePosted);
    if (filters?.jobType?.length) params.append('jobType', filters.jobType.join(','));
    if (filters?.workMode?.length) params.append('workMode', filters.workMode.join(','));
    if (filters?.location) params.append('location', filters.location);

    const { data } = await api.post(`/api/matches/calculate?${params.toString()}`);
    return data;
  },
};

// Applications
export const applicationsApi = {
  create: async (jobId: string, status?: Application['status'], notes?: string) => {
    const { data } = await api.post('/api/applications', { jobId, status, notes });
    return data;
  },
  getAll: async () => {
    const { data } = await api.get('/api/applications');
    return data;
  },
  get: async (id: string) => {
    const { data } = await api.get(`/api/applications/${id}`);
    return data;
  },
  updateStatus: async (id: string, status: Application['status'], note?: string) => {
    const { data } = await api.patch(`/api/applications/${id}`, { status, note });
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/api/applications/${id}`);
    return data;
  },
};

// Assistant
export const assistantApi = {
  sendMessage: async (message: string) => {
    const { data } = await api.post('/api/assistant/chat', { message });
    return data;
  },
  getConversation: async () => {
    const { data } = await api.get('/api/assistant/conversation');
    return data;
  },
  clearConversation: async () => {
    const { data } = await api.delete('/api/assistant/conversation');
    return data;
  },
};
