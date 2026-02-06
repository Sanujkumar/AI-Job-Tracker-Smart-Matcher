import { Job, MatchScore } from '@/types';
import { Briefcase, MapPin, Clock, ExternalLink, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: Job;
  matchScore?: MatchScore;
  onApply: (job: Job) => void;
}

export default function JobCard({ job, matchScore, onApply }: JobCardProps) {
  const getMatchColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-600 border-gray-200';
    if (score > 70) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <div className="card hover:shadow-lg transition-all duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className="flex gap-3 flex-1">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
            <p className="text-gray-600 font-medium">{job.company}</p>
          </div>
        </div>
        {matchScore && (
          <div className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getMatchColor(matchScore.score)}`}>
            {matchScore.score}%
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          {job.location}
        </div>
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Briefcase className="w-4 h-4" />
            {job.jobType}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            {formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })}
          </div>
        </div>
        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
          job.workMode === 'remote' ? 'bg-green-100 text-green-700' :
          job.workMode === 'hybrid' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {job.workMode}
        </span>
      </div>

      <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {job.skills.slice(0, 5).map((skill, idx) => (
          <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
            {skill}
          </span>
        ))}
      </div>

      {matchScore?.explanation && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-gray-700">{matchScore.explanation.overallReason}</p>
        </div>
      )}

      <button onClick={() => onApply(job)} className="w-full btn-primary flex items-center justify-center gap-2">
        Apply Now <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
}
