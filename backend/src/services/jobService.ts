import { readJSON, writeJSON } from '../utils/storage';
import { Job } from '../types';
import { generateMockJobs } from '../utils/mockJobs';

export class JobService {
  private readonly JOBS_FILE = 'jobs.json';

  initializeJobs(): void {
    let jobs = readJSON<Job[]>(this.JOBS_FILE);
    
    if (jobs.length === 0) {
      jobs = generateMockJobs(50);
      writeJSON(this.JOBS_FILE, jobs);
    }
  }

  async getAllJobs(filters?: {
    role?: string;
    skills?: string[];
    datePosted?: '24h' | 'week' | 'month' | 'anytime';
    jobType?: Job['jobType'][];
    workMode?: Job['workMode'][];
    location?: string;
  }): Promise<Job[]> {
    let jobs = readJSON<Job[]>(this.JOBS_FILE);

    // Apply filters
    if (filters?.role) {
      const roleSearch = filters.role.toLowerCase();
      jobs = jobs.filter(job => 
        job.title.toLowerCase().includes(roleSearch) ||
        job.description.toLowerCase().includes(roleSearch)
      );
    }

    if (filters?.skills && filters.skills.length > 0) {
      jobs = jobs.filter(job => 
        filters.skills!.some(skill => 
          job.skills.some(jobSkill => 
            jobSkill.toLowerCase().includes(skill.toLowerCase())
          )
        )
      );
    }

    if (filters?.datePosted && filters.datePosted !== 'anytime') {
      const now = new Date();
      const cutoffDate = new Date();
      
      switch (filters.datePosted) {
        case '24h':
          cutoffDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
      }

      jobs = jobs.filter(job => new Date(job.postedDate) >= cutoffDate);
    }

    if (filters?.jobType && filters.jobType.length > 0) {
      jobs = jobs.filter(job => filters.jobType!.includes(job.jobType));
    }

    if (filters?.workMode && filters.workMode.length > 0) {
      jobs = jobs.filter(job => filters.workMode!.includes(job.workMode));
    }

    if (filters?.location) {
      const locationSearch = filters.location.toLowerCase();
      jobs = jobs.filter(job => 
        job.location.toLowerCase().includes(locationSearch)
      );
    }

    return jobs;
  }

  async getJobById(id: string): Promise<Job | null> {
    const jobs = readJSON<Job[]>(this.JOBS_FILE);
    return jobs.find(job => job.id === id) || null;
  }

  async getJobsByIds(ids: string[]): Promise<Job[]> {
    const jobs = readJSON<Job[]>(this.JOBS_FILE);
    return jobs.filter(job => ids.includes(job.id));
  }
}
