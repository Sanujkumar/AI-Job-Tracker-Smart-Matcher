'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { jobsApi, matchesApi, resumeApi, applicationsApi } from '@/lib/api';
import { Job, MatchScore, Filters, FilterUpdate, Resume } from '@/types';
import JobCard from '@/components/JobCard';
import FilterPanel from '@/components/Filters';
import AIAssistant from '@/components/AIAssistant';
import { Upload, LogOut, FileText, Briefcase, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [matches, setMatches] = useState<MatchScore[]>([]);
  const [filters, setFilters] = useState<Filters>({
    role: '',
    skills: [],
    datePosted: 'anytime',
    jobType: [],
    workMode: [],
    location: '',
    matchScore: 'all'
  });
  const [resume, setResume] = useState<Resume | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    loadData();
    checkResume();

    // Listen for window focus (user returns from job site)
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, []);

  useEffect(() => {
    loadJobs();
  }, [filters]);

  const loadData = async () => {
    try {
      await Promise.all([loadJobs(), loadMatches()]);
    } finally {
      setLoading(false);
    }
  };

  const loadJobs = async () => {
    try {
      const { jobs: fetchedJobs } = await jobsApi.getJobs(filters);
      setJobs(fetchedJobs);
    } catch (error) {
      console.error('Failed to load jobs');
    }
  };

  const loadMatches = async () => {
    try {
      const { matches: fetchedMatches } = await matchesApi.getMatches({
        matchScore: filters.matchScore
      });
      setMatches(fetchedMatches);
    } catch (error) {
      console.error('Failed to load matches');
    }
  };

  const checkResume = async () => {
    try {
      const { resume: userResume } = await resumeApi.get();
      setResume(userResume);
    } catch (error) {
      // No resume uploaded
    }
  };

  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingResume(true);
    try {
      const { resume: uploadedResume } = await resumeApi.upload(file);
      setResume(uploadedResume);

      // Calculate matches after resume upload
      await matchesApi.calculateMatches(filters);
      await loadMatches();

      alert('Resume uploaded successfully! Calculating job matches...');
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload resume');
    } finally {
      setUploadingResume(false);
    }
  };

  const handleApply = (job: Job) => {
    setSelectedJob(job);
    window.open(job.applyUrl, '_blank');
  };

  const handleWindowFocus = () => {
    if (selectedJob) {
      setTimeout(() => {
        setShowApplyModal(true);
      }, 500);
    }
  };

  const handleApplicationResponse = async (response: 'applied' | 'browsing' | 'earlier') => {
    if (response === 'applied' && selectedJob) {
      try {
        await applicationsApi.create(selectedJob.id, 'applied');
        alert('Application tracked!');
      } catch (error) {
        console.error('Failed to track application');
      }
    }
    setShowApplyModal(false);
    setSelectedJob(null);
  };

  const handleFilterUpdate = (update: FilterUpdate) => {
    setFilters(prev => ({ ...prev, ...update }));
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    router.push('/');
  };

  const bestMatches = matches
    .filter(m => m.score > 70)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  const getMatchForJob = (jobId: string) => {
    return matches.find(m => m.jobId === jobId);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personalized job feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">AI Job Tracker</h1>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/dashboard/applications')}
                className="btn-outline flex items-center gap-2"
              >
                <Briefcase className="w-4 h-4" />
                Applications
              </button>

              <div className="relative">
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleResumeUpload}
                  className="hidden"
                  id="resume-upload"
                />
                <label
                  htmlFor="resume-upload"
                  className={`btn-secondary flex items-center gap-2 cursor-pointer ${uploadingResume ? 'opacity-50' : ''}`}
                >
                  {uploadingResume ? (
                    <>
                      <div className="w-4 h-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      {resume ? 'Replace Resume' : 'Upload Resume'}
                    </>
                  )}
                </label>
              </div>

              <button onClick={handleLogout} className="text-gray-600 hover:text-gray-900">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!resume && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <FileText className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-900">Upload your resume to enable AI matching!</p>
              <p className="text-sm text-yellow-700 mt-1">
                Get personalized match scores and recommendations based on your skills and experience.
              </p>
            </div>
          </div>
        )}

        {resume && bestMatches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">Best Matches for You</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bestMatches.map(match => {
                const job = jobs.find(j => j.id === match.jobId);
                return job ? (
                  <JobCard key={job.id} job={job} matchScore={match} onApply={handleApply} />
                ) : null;
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <FilterPanel filters={filters} onChange={setFilters} />
          </div>

          <div className="lg:col-span-3">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                All Jobs ({jobs.length})
              </h2>
            </div>

            {jobs.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-600">No jobs found matching your criteria.</p>
                <p className="text-sm text-gray-500 mt-2">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {jobs.map(job => (
                  <JobCard
                    key={job.id}
                    job={job}
                    matchScore={getMatchForJob(job.id)}
                    onApply={handleApply}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AIAssistant onFilterUpdate={handleFilterUpdate} />

      {showApplyModal && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 animate-scale-in">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Did you apply to this job?
            </h3>
            <p className="text-gray-600 mb-6">
              {selectedJob.title} at {selectedJob.company}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => handleApplicationResponse('applied')}
                className="w-full btn-primary"
              >
                Yes, I applied
              </button>
              <button
                onClick={() => handleApplicationResponse('browsing')}
                className="w-full btn-secondary"
              >
                No, just browsing
              </button>
              <button
                onClick={() => handleApplicationResponse('earlier')}
                className="w-full btn-outline"
              >
                I applied earlier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
