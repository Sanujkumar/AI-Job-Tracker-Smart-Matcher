'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { applicationsApi } from '@/lib/api';
import { Application } from '@/types';
import { ArrowLeft, Briefcase, Calendar, CheckCircle, Clock, XCircle, Building2 } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export default function ApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      const { applications: apps } = await applicationsApi.getAll();
      setApplications(apps);
    } catch (error) {
      console.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: Application['status']) => {
    try {
      await applicationsApi.updateStatus(id, status);
      await loadApplications();
    } catch (error) {
      console.error('Failed to update status');
    }
  };

  const getStatusIcon = (status: Application['status']) => {
    switch (status) {
      case 'applied':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'interview':
        return <Calendar className="w-5 h-5 text-yellow-600" />;
      case 'offer':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: Application['status']) => {
    switch (status) {
      case 'applied':
        return 'bg-blue-100 text-blue-700';
      case 'interview':
        return 'bg-yellow-100 text-yellow-700';
      case 'offer':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
    }
  };

  const stats = {
    total: applications.length,
    applied: applications.filter(a => a.status === 'applied').length,
    interview: applications.filter(a => a.status === 'interview').length,
    offer: applications.filter(a => a.status === 'offer').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <button onClick={() => router.push('/dashboard')} className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">My Applications</h1>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Briefcase className="w-8 h-8 text-gray-400" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Applied</p>
                <p className="text-3xl font-bold text-blue-600">{stats.applied}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Interviews</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.interview}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-400" />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Offers</p>
                <p className="text-3xl font-bold text-green-600">{stats.offer}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="card text-center py-12">
            <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No applications yet</h3>
            <p className="text-gray-600 mb-4">Start applying to jobs to track your progress here!</p>
            <button onClick={() => router.push('/dashboard')} className="btn-primary">
              Browse Jobs
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {applications.map(app => (
              <div key={app.id} className="card hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-3 flex-1">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{app.job?.title || 'Job Title'}</h3>
                      <p className="text-gray-600">{app.job?.company || 'Company'}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        Applied {formatDistanceToNow(new Date(app.appliedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {getStatusIcon(app.status)}
                    <select
                      value={app.status}
                      onChange={(e) => updateStatus(app.id, e.target.value as Application['status'])}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusColor(app.status)} border-0 cursor-pointer`}
                    >
                      <option value="applied">Applied</option>
                      <option value="interview">Interview</option>
                      <option value="offer">Offer</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {app.timeline.length > 1 && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Timeline</h4>
                    <div className="space-y-3">
                      {app.timeline.map((event, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className="mt-1">{getStatusIcon(event.status)}</div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 capitalize">
                              {event.status.replace('-', ' ')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(event.date), 'MMM d, yyyy h:mm a')}
                            </p>
                            {event.note && (
                              <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
