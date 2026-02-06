import { readJSON, writeJSON, appendToArray, updateInArray } from '../utils/storage';
import { Application, TimelineEvent } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ApplicationService {
  private readonly APPLICATIONS_FILE = 'applications.json';

  async createApplication(
    userId: string,
    jobId: string,
    status: Application['status'] = 'applied',
    notes?: string
  ): Promise<Application> {
    const now = new Date().toISOString();

    const application: Application = {
      id: uuidv4(),
      userId,
      jobId,
      status,
      appliedAt: now,
      notes,
      timeline: [
        {
          status,
          date: now,
          note: notes
        }
      ]
    };

    appendToArray(this.APPLICATIONS_FILE, application);
    return application;
  }

  async getApplications(userId: string): Promise<Application[]> {
    const applications = readJSON<Application[]>(this.APPLICATIONS_FILE);
    return applications.filter(app => app.userId === userId);
  }

  async getApplication(id: string): Promise<Application | null> {
    const applications = readJSON<Application[]>(this.APPLICATIONS_FILE);
    return applications.find(app => app.id === id) || null;
  }

  async getApplicationByJob(userId: string, jobId: string): Promise<Application | null> {
    const applications = readJSON<Application[]>(this.APPLICATIONS_FILE);
    return applications.find(app => app.userId === userId && app.jobId === jobId) || null;
  }

  async updateStatus(
    id: string,
    status: Application['status'],
    note?: string
  ): Promise<Application | null> {
    const applications = readJSON<Application[]>(this.APPLICATIONS_FILE);
    const app = applications.find(a => a.id === id);

    if (!app) return null;

    // Add timeline event
    const timelineEvent: TimelineEvent = {
      status,
      date: new Date().toISOString(),
      note
    };

    app.timeline.push(timelineEvent);
    app.status = status;

    writeJSON(this.APPLICATIONS_FILE, applications);

    return app;
  }

  async deleteApplication(id: string): Promise<boolean> {
    const applications = readJSON<Application[]>(this.APPLICATIONS_FILE);
    const index = applications.findIndex(app => app.id === id);

    if (index === -1) return false;

    applications.splice(index, 1);
    writeJSON(this.APPLICATIONS_FILE, applications);

    return true;
  }
}
