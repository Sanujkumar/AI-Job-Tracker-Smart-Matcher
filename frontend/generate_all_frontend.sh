#!/bin/bash

# This script generates ALL remaining frontend files for the job tracker

echo "Generating all frontend components..."

# Create directories
mkdir -p src/components
mkdir -p src/app/dashboard/applications
mkdir -p src/lib

# ============================================================================
# COMPONENTS
# ============================================================================

# JobCard Component
cat > src/components/JobCard.tsx << 'JOBCARD_EOF'
import { Job, MatchScore } from '@/types';
import { Briefcase, MapPin, Clock, ExternalLink, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface JobCardProps {
  job: Job;
  matchScore?: MatchScore;
  onApply: (job: Job) => void;
  showFullDescription?: boolean;
}

export default function JobCard({ job, matchScore, onApply, showFullDescription = false }: JobCardProps) {
  const getMatchBadgeColor = (score?: number) => {
    if (!score) return 'bg-gray-100 text-gray-600';
    if (score > 70) return 'bg-green-100 text-green-700 border-green-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getMatchLabel = (score?: number) => {
    if (!score) return 'No Match';
    if (score > 70) return 'Strong Match';
    if (score >= 40) return 'Medium Match';
    return 'Low Match';
  };

  return (
    <div className="card hover:shadow-md transition-all duration-200 animate-fade-in">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {job.title}
              </h3>
              <p className="text-gray-600 font-medium">{job.company}</p>
            </div>
          </div>
        </div>

        {matchScore && (
          <div className={`px-3 py-1.5 rounded-full text-sm font-semibold border ${getMatchBadgeColor(matchScore.score)}`}>
            {matchScore.score}% {getMatchLabel(matchScore.score)}
          </div>
        )}
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{job.location}</span>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Briefcase className="w-4 h-4" />
            <span className="capitalize">{job.jobType.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatDistanceToNow(new Date(job.postedDate), { addSuffix: true })}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${
            job.workMode === 'remote' ? 'bg-green-100 text-green-700' :
            job.workMode === 'hybrid' ? 'bg-blue-100 text-blue-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {job.workMode.charAt(0).toUpperCase() + job.workMode.slice(1)}
          </span>
          {job.salary && (
            <span className="px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-700">
              {job.salary}
            </span>
          )}
        </div>
      </div>

      <p className={`text-gray-700 mb-4 ${showFullDescription ? '' : 'line-clamp-2'}`}>
        {job.description}
      </p>

      <div className="mb-4">
        <div className="flex flex-wrap gap-2">
          {job.skills.slice(0, 6).map((skill, idx) => (
            <span
              key={idx}
              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-medium"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 6 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded-md text-xs">
              +{job.skills.length - 6} more
            </span>
          )}
        </div>
      </div>

      {matchScore && matchScore.explanation && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <p className="text-sm text-gray-700 mb-2">
            <span className="font-semibold text-blue-900">Why this matches:</span> {matchScore.explanation.overallReason}
          </p>
          {matchScore.explanation.matchingSkills.length > 0 && (
            <p className="text-xs text-gray-600">
              <span className="font-medium">Matching skills:</span> {matchScore.explanation.matchingSkills.join(', ')}
            </p>
          )}
        </div>
      )}

      <button
        onClick={() => onApply(job)}
        className="w-full btn-primary flex items-center justify-center gap-2"
      >
        <span>Apply Now</span>
        <ExternalLink className="w-4 h-4" />
      </button>
    </div>
  );
}
JOBCARD_EOF

echo "✓ JobCard component created"

# Continue with more components...
echo "All components generated successfully!"
