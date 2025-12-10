import { useEffect, useState } from 'react';
import { adminService } from '../services/api';
import type { AnalyticsResponse } from '../types';

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState(30);

  const loadStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getUsageStats(days);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="bg-white rounded-xl p-6 pt-2 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/analytics.svg" alt="Logo" className="h-7 w-7 rounded-full" />
          <h2 className="text-lg font-semibold text-slate-900">Analytics</h2>
        </div>
        <div className="flex items-end gap-2">
          <div className="flex flex-col gap-1">
            <label htmlFor="days" className="text-sm font-semibold text-slate-700">Days</label>
            <input
              id="days"
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value) || 30)}
              className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button
            onClick={loadStats}
            disabled={loading}
            className="py-2 px-4 bg-blue-400 text-white rounded-lg font-semibold hover:bg-blue-600 disabled:bg-slate-300 transition"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-100 text-sm">{error}</div>}

      {analytics && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 className="text-xs font-semibold text-slate-600 uppercase">Total Requests</h3>
              <p className="text-2xl font-bold text-slate-900 mt-1">
                {analytics.summary.total_requests.toLocaleString()}
              </p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <h3 className="text-xs font-semibold text-slate-600 uppercase">Period</h3>
              <p className="text-sm text-slate-800 mt-1">
                {(() => {
                  // Parse ISO date strings properly to avoid timezone issues
                  const startDate = new Date(analytics.period_start);
                  const endDate = new Date(analytics.period_end);
                  // Format as YYYY-MM-DD to avoid timezone conversion issues
                  const formatDate = (date: Date) => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    return `${month}/${day}/${year}`;
                  };
                  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
                })()}
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">By Service</h3>
            <div className="flex flex-col gap-2">
              {Object.entries(analytics.summary.by_service)
                .sort(([, a], [, b]) => b - a)
                .map(([service, count]) => (
                  <div key={service} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-sm text-slate-800 font-medium">{service}</span>
                    <span className="text-sm font-semibold text-slate-900">{count.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-3">By Endpoint</h3>
            <div className="flex flex-col gap-2 max-h-80 overflow-auto">
              {Object.entries(analytics.summary.by_endpoint)
                .sort(([, a], [, b]) => b - a)
                .map(([endpoint, count]) => (
                  <div key={endpoint} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                    <span className="text-sm text-slate-700 font-mono">{endpoint}</span>
                    <span className="text-sm font-semibold text-slate-900">{count.toLocaleString()}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

