'use client';
import { Filters as FilterType } from '@/types';
import { X } from 'lucide-react';

interface FiltersProps {
  filters: FilterType;
  onChange: (filters: FilterType) => void;
}

const allSkills = ['React', 'TypeScript', 'Python', 'Node.js', 'AWS', 'Docker', 'PostgreSQL', 'MongoDB'];

export default function Filters({ filters, onChange }: FiltersProps) {
  const updateFilter = (key: keyof FilterType, value: any) => {
    onChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onChange({
      role: '',
      skills: [],
      datePosted: 'anytime',
      jobType: [],
      workMode: [],
      location: '',
      matchScore: 'all'
    });
  };

  const hasActiveFilters = Object.values(filters).some(v => 
    Array.isArray(v) ? v.length > 0 : v && v !== 'anytime' && v !== 'all'
  );

  return (
    <div className="card space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">Filters</h3>
        {hasActiveFilters && (
          <button onClick={clearFilters} className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1">
            <X className="w-4 h-4" /> Clear All
          </button>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Role/Title</label>
        <input
          type="text"
          value={filters.role || ''}
          onChange={(e) => updateFilter('role', e.target.value)}
          className="input-field"
          placeholder="e.g. Frontend Engineer"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Skills</label>
        <div className="flex flex-wrap gap-2">
          {allSkills.map(skill => (
            <button
              key={skill}
              onClick={() => {
                const current = filters.skills || [];
                updateFilter('skills', current.includes(skill) 
                  ? current.filter(s => s !== skill)
                  : [...current, skill]
                );
              }}
              className={`px-3 py-1 rounded-full text-sm ${
                filters.skills?.includes(skill)
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {skill}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Work Mode</label>
        <div className="space-y-2">
          {(['remote', 'hybrid', 'onsite'] as const).map(mode => (
            <label key={mode} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.workMode?.includes(mode) || false}
                onChange={(e) => {
                  const current = filters.workMode || [];
                  updateFilter('workMode', e.target.checked
                    ? [...current, mode]
                    : current.filter(m => m !== mode)
                  );
                }}
                className="rounded"
              />
              <span className="text-sm capitalize">{mode}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Job Type</label>
        <div className="space-y-2">
          {(['full-time', 'part-time', 'contract', 'internship'] as const).map(type => (
            <label key={type} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={filters.jobType?.includes(type) || false}
                onChange={(e) => {
                  const current = filters.jobType || [];
                  updateFilter('jobType', e.target.checked
                    ? [...current, type]
                    : current.filter(t => t !== type)
                  );
                }}
                className="rounded"
              />
              <span className="text-sm capitalize">{type.replace('-', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Date Posted</label>
        <select
          value={filters.datePosted || 'anytime'}
          onChange={(e) => updateFilter('datePosted', e.target.value)}
          className="input-field"
        >
          <option value="anytime">Anytime</option>
          <option value="24h">Last 24 hours</option>
          <option value="week">Last week</option>
          <option value="month">Last month</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Match Score</label>
        <select
          value={filters.matchScore || 'all'}
          onChange={(e) => updateFilter('matchScore', e.target.value)}
          className="input-field"
        >
          <option value="all">All Matches</option>
          <option value="high">High (70%)</option>
          <option value="medium">Medium (40-70%)</option>
        </select>
      </div>
    </div>
  );
}
