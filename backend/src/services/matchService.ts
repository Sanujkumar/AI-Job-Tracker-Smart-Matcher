import { readJSON, writeJSON } from '../utils/storage';
import { MatchScore, Job, Resume } from '../types';
import { JobMatcher } from '../ai/jobMatcher';

export class MatchService {
  private readonly MATCHES_FILE = 'matches.json';
  private matcher: JobMatcher;

  constructor() {
    this.matcher = new JobMatcher();
  }

  async calculateMatches(
    userId: string,
    resume: Resume,
    jobs: Job[]
  ): Promise<MatchScore[]> {
    const matches: MatchScore[] = [];

    // Calculate matches in parallel (with limit to avoid rate limiting)
    const batchSize = 10;
    for (let i = 0; i < jobs.length; i += batchSize) {
      const batch = jobs.slice(i, i + batchSize);
      const batchMatches = await Promise.all(
        batch.map(job => this.matcher.calculateMatchScore(resume, job))
      );
      matches.push(...batchMatches);
    }

    // Store matches
    const allMatches = readJSON<MatchScore[]>(this.MATCHES_FILE);
    
    // Remove old matches for this user
    const filteredMatches = allMatches.filter(m => m.userId !== userId);
    
    // Add new matches
    filteredMatches.push(...matches);
    
    writeJSON(this.MATCHES_FILE, filteredMatches);

    return matches;
  }

  async getMatches(userId: string, jobIds?: string[]): Promise<MatchScore[]> {
    const matches = readJSON<MatchScore[]>(this.MATCHES_FILE);
    
    let userMatches = matches.filter(m => m.userId === userId);

    if (jobIds) {
      userMatches = userMatches.filter(m => jobIds.includes(m.jobId));
    }

    return userMatches;
  }

  async getBestMatches(userId: string, limit: number = 8): Promise<MatchScore[]> {
    const matches = await this.getMatches(userId);
    
    return matches
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async getMatchForJob(userId: string, jobId: string): Promise<MatchScore | null> {
    const matches = readJSON<MatchScore[]>(this.MATCHES_FILE);
    return matches.find(m => m.userId === userId && m.jobId === jobId) || null;
  }
}
