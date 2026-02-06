import { readJSON, writeJSON } from '../utils/storage';
import { Resume } from '../types';
import pdf from 'pdf-parse';
import fs from 'fs';
import path from 'path';

export class ResumeService {
  private readonly RESUMES_FILE = 'resumes.json';
  private readonly UPLOADS_DIR = path.join(__dirname, '../../uploads');

  constructor() {
    if (!fs.existsSync(this.UPLOADS_DIR)) {
      fs.mkdirSync(this.UPLOADS_DIR, { recursive: true });
    }
  }

  async uploadResume(
    userId: string,
    file: Buffer,
    filename: string
  ): Promise<Resume> {
    // Extract text based on file type
    const extractedText = await this.extractText(file, filename);
    
    // Parse resume content
    const skills = this.extractSkills(extractedText);
    const experience = this.extractExperience(extractedText);
    const keywords = this.extractKeywords(extractedText);

    // Save file
    const filepath = path.join(this.UPLOADS_DIR, `${userId}_${filename}`);
    fs.writeFileSync(filepath, file);

    // Create resume object
    const resume: Resume = {
      userId,
      filename,
      uploadedAt: new Date().toISOString(),
      extractedText,
      skills,
      experience,
      keywords
    };

    // Store resume data
    const resumes = readJSON<Record<string, Resume>>(this.RESUMES_FILE);
    resumes[userId] = resume;
    writeJSON(this.RESUMES_FILE, resumes);

    return resume;
  }

  async getResume(userId: string): Promise<Resume | null> {
    const resumes = readJSON<Record<string, Resume>>(this.RESUMES_FILE);
    return resumes[userId] || null;
  }

  async deleteResume(userId: string): Promise<boolean> {
    const resumes = readJSON<Record<string, Resume>>(this.RESUMES_FILE);
    
    if (!resumes[userId]) return false;

    // Delete file
    const filepath = path.join(
      this.UPLOADS_DIR,
      `${userId}_${resumes[userId].filename}`
    );
    
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    // Delete from storage
    delete resumes[userId];
    writeJSON(this.RESUMES_FILE, resumes);

    return true;
  }

  private async extractText(buffer: Buffer, filename: string): Promise<string> {
    const ext = path.extname(filename).toLowerCase();

    if (ext === '.pdf') {
      try {
        const data = await pdf(buffer);
        return data.text;
      } catch (error) {
        console.error('PDF parsing error:', error);
        return '';
      }
    } else if (ext === '.txt') {
      return buffer.toString('utf-8');
    } else {
      throw new Error('Unsupported file type. Please upload PDF or TXT.');
    }
  }

  private extractSkills(text: string): string[] {
    // Common tech skills to look for
    const commonSkills = [
      'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'Go', 'Rust',
      'React', 'Vue', 'Angular', 'Next.js', 'Node.js', 'Express',
      'Django', 'Flask', 'Spring', 'FastAPI',
      'PostgreSQL', 'MongoDB', 'MySQL', 'Redis',
      'AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes',
      'Git', 'CI/CD', 'REST', 'GraphQL', 'Microservices',
      'TensorFlow', 'PyTorch', 'Machine Learning', 'AI',
      'Agile', 'Scrum', 'Leadership', 'Team Management'
    ];

    return commonSkills.filter(skill => 
      new RegExp(`\\b${skill}\\b`, 'i').test(text)
    );
  }

  private extractExperience(text: string): string[] {
    // Extract bullet points that likely describe experience
    const lines = text.split('\n');
    const experienceBullets: string[] = [];

    let inExperienceSection = false;

    for (const line of lines) {
      const trimmed = line.trim();
      
      // Detect experience section headers
      if (/experience|work history|employment/i.test(trimmed)) {
        inExperienceSection = true;
        continue;
      }

      // Detect end of experience section
      if (/education|skills|projects|certifications/i.test(trimmed)) {
        inExperienceSection = false;
      }

      // Extract bullets
      if (inExperienceSection && (trimmed.startsWith('-') || trimmed.startsWith('•') || trimmed.startsWith('*'))) {
        experienceBullets.push(trimmed.replace(/^[-•*]\s*/, ''));
      }
    }

    return experienceBullets;
  }

  private extractKeywords(text: string): string[] {
    // Extract important keywords (simplified version)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 4); // Filter short words

    // Count frequency
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Get top keywords
    return Object.entries(frequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word]) => word);
  }
}
