import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { Job, Resume, MatchScore } from '../types';

export class JobMatcher {
  private llm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      modelName: 'gpt-3.5-turbo',
      temperature: 0.3,
    });
  }

  /**
   * Calculate match score between resume and job using LangChain
   */
  async calculateMatchScore(resume: Resume, job: Job): Promise<MatchScore> {
    // Extract key elements
    const resumeSkills = new Set(resume.skills.map(s => s.toLowerCase()));
    const jobSkills = new Set(job.skills.map(s => s.toLowerCase()));
    const resumeKeywords = new Set(resume.keywords.map(k => k.toLowerCase()));
    
    // 1. Skills Overlap (40% weight)
    const matchingSkills = job.skills.filter(skill => 
      resumeSkills.has(skill.toLowerCase())
    );
    const skillsScore = (matchingSkills.length / Math.max(job.skills.length, 1)) * 40;

    // 2. Experience Relevance (30% weight)
    const experienceScore = await this.calculateExperienceRelevance(
      resume.experience,
      job.requirements,
      job.description
    );

    // 3. Keyword Alignment (20% weight)
    const jobKeywords = this.extractKeywords(job.description + ' ' + job.requirements.join(' '));
    const keywordMatches = jobKeywords.filter(keyword => 
      resumeKeywords.has(keyword.toLowerCase()) || 
      resume.extractedText.toLowerCase().includes(keyword.toLowerCase())
    );
    const keywordScore = (keywordMatches.length / Math.max(jobKeywords.length, 1)) * 20;

    // 4. Job Level Fit (10% weight)
    const levelScore = this.calculateLevelFit(resume, job) * 10;

    // Total score
    const totalScore = Math.min(100, Math.round(skillsScore + experienceScore + keywordScore + levelScore));

    // Generate explanation using LangChain
    const explanation = await this.generateExplanation(
      resume,
      job,
      matchingSkills,
      keywordMatches,
      totalScore
    );

    return {
      jobId: job.id,
      userId: resume.userId,
      score: totalScore,
      explanation: {
        matchingSkills,
        relevantExperience: this.findRelevantExperience(resume.experience, job),
        keywordAlignment: keywordMatches,
        overallReason: explanation
      },
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate experience relevance using LLM
   */
  private async calculateExperienceRelevance(
    experience: string[],
    requirements: string[],
    description: string
  ): Promise<number> {
    const prompt = PromptTemplate.fromTemplate(`
You are an expert recruiter analyzing candidate experience fit.

Job Requirements:
{requirements}

Job Description:
{description}

Candidate Experience:
{experience}

Rate the experience relevance on a scale of 0-30 (where 30 is perfect match).
Consider:
- Years of relevant experience
- Matching technologies/domains
- Similar project types
- Comparable company sizes/industries

Return ONLY a number between 0 and 30.
    `);

    try {
      const chain = prompt.pipe(this.llm);
      const result = await chain.invoke({
        requirements: requirements.join('\n'),
        description,
        experience: experience.join('\n')
      });

      const score = parseFloat(result.content.toString().trim());
      return isNaN(score) ? 15 : Math.min(30, Math.max(0, score));
    } catch (error) {
      console.error('Error calculating experience relevance:', error);
      return 15; // Default middle score
    }
  }

  /**
   * Generate human-readable explanation
   */
  private async generateExplanation(
    resume: Resume,
    job: Job,
    matchingSkills: string[],
    keywordMatches: string[],
    score: number
  ): Promise<string> {
    const prompt = PromptTemplate.fromTemplate(`
You are a career advisor explaining job match quality.

Job Title: {jobTitle}
Company: {company}
Match Score: {score}/100

Matching Skills: {matchingSkills}
Keyword Matches: {keywords}

Write a concise 2-3 sentence explanation of why this is a {level} match.
Focus on strengths and potential fit. Be encouraging but honest.

{level} matches should emphasize strong alignment.
Medium matches should note partial fit and growth opportunities.
Low matches should be diplomatic about gaps.
    `);

    const level = score > 70 ? 'strong' : score > 40 ? 'medium' : 'weak';

    try {
      const chain = prompt.pipe(this.llm);
      const result = await chain.invoke({
        jobTitle: job.title,
        company: job.company,
        score: score.toString(),
        matchingSkills: matchingSkills.join(', ') || 'None directly listed',
        keywords: keywordMatches.join(', ') || 'Limited overlap',
        level
      });

      return result.content.toString().trim();
    } catch (error) {
      console.error('Error generating explanation:', error);
      return this.getDefaultExplanation(score, matchingSkills.length, job.title);
    }
  }

  /**
   * Fallback explanation if LLM fails
   */
  private getDefaultExplanation(score: number, skillMatches: number, jobTitle: string): string {
    if (score > 70) {
      return `Strong match for ${jobTitle}! You have ${skillMatches} matching skills and relevant experience.`;
    } else if (score > 40) {
      return `Moderate fit for ${jobTitle}. You meet some requirements, with ${skillMatches} matching skills.`;
    } else {
      return `This ${jobTitle} role has different requirements, with limited skill overlap. Consider it for growth opportunities.`;
    }
  }

  /**
   * Extract important keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Common tech keywords (in production, use NLP library)
    const commonKeywords = [
      'agile', 'scrum', 'ci/cd', 'api', 'microservices',
      'cloud', 'aws', 'azure', 'gcp', 'testing',
      'leadership', 'team', 'architect', 'design', 'scale'
    ];

    return commonKeywords.filter(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  /**
   * Find relevant experience bullets
   */
  private findRelevantExperience(experience: string[], job: Job): string[] {
    const jobText = (job.description + ' ' + job.requirements.join(' ')).toLowerCase();
    
    return experience.filter(exp => {
      const expLower = exp.toLowerCase();
      return job.skills.some(skill => expLower.includes(skill.toLowerCase())) ||
             this.extractKeywords(jobText).some(keyword => expLower.includes(keyword));
    }).slice(0, 3); // Top 3 most relevant
  }

  /**
   * Calculate job level fit
   */
  private calculateLevelFit(resume: Resume, job: Job): number {
    const jobLevel = this.inferJobLevel(job);
    const candidateLevel = this.inferCandidateLevel(resume);

    // Perfect match: same level
    if (jobLevel === candidateLevel) return 1.0;
    
    // Good match: one level difference
    const levelDiff = Math.abs(jobLevel - candidateLevel);
    if (levelDiff === 1) return 0.7;
    
    // Moderate match: two levels difference
    if (levelDiff === 2) return 0.4;
    
    // Poor match: large gap
    return 0.2;
  }

  /**
   * Infer job seniority level
   */
  private inferJobLevel(job: Job): number {
    const title = job.title.toLowerCase();
    
    if (title.includes('intern') || title.includes('junior')) return 1;
    if (title.includes('senior') || title.includes('lead')) return 3;
    if (title.includes('staff') || title.includes('principal')) return 4;
    if (title.includes('director') || title.includes('vp')) return 5;
    
    return 2; // Default: mid-level
  }

  /**
   * Infer candidate seniority level
   */
  private inferCandidateLevel(resume: Resume): number {
    const text = resume.extractedText.toLowerCase();
    const experienceYears = this.extractYearsOfExperience(text);
    
    if (experienceYears < 2) return 1; // Junior
    if (experienceYears < 5) return 2; // Mid
    if (experienceYears < 8) return 3; // Senior
    if (experienceYears < 12) return 4; // Staff
    return 5; // Principal/Director
  }

  /**
   * Extract years of experience from text
   */
  private extractYearsOfExperience(text: string): number {
    const patterns = [
      /(\d+)\+?\s*years?\s*of\s*experience/i,
      /experience:\s*(\d+)\+?\s*years?/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return parseInt(match[1]);
      }
    }

    // Count experience bullets as rough proxy
    const experienceCount = (text.match(/\n-/g) || []).length;
    return Math.min(15, experienceCount); // Cap at 15 years
  }
}
