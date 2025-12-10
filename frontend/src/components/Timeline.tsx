import { useEffect, useState } from 'react';
import { timelineService } from '../services/api';
import type { TimelineDataPoint } from '../types';
import { EmotionHeatmap } from './EmotionHeatmap';

interface TimelineProps {
  userId: string;
}

const EMOTION_COLORS: Record<string, string> = {
  happy: '#4CAF50',
  sad: '#2196F3',
  calm: '#9C27B0',
  stressed: '#FF9800',
  excited: '#F44336',
  neutral: '#9E9E9E',
};

export function Timeline({ userId }: TimelineProps) {
  const [timelineData, setTimelineData] = useState<TimelineDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bucket, setBucket] = useState<'month' | 'week' | 'day'>('month');

  useEffect(() => {
    loadTimeline();
  }, [userId, bucket]);

  const loadTimeline = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await timelineService.getTimeline(userId, bucket);
      
      // Normalize the data - backend is returning old format with individual emotion fields
      const normalizedData = response.data.map((period: any) => {
        // Check if it's the new format (has emotions dict)
        if (period.emotions && typeof period.emotions === 'object' && !Array.isArray(period.emotions)) {
          return {
            period: period.period,
            emotions: period.emotions
          };
        }
        
        // Convert old format (individual fields) to new format (emotions dict)
        const emotions: Record<string, number> = {};
        // Include all emotions, even if 0, to show the full picture
        if (period.happy !== undefined) emotions.happy = period.happy || 0;
        if (period.sad !== undefined) emotions.sad = period.sad || 0;
        if (period.calm !== undefined) emotions.calm = period.calm || 0;
        if (period.stressed !== undefined) emotions.stressed = period.stressed || 0;
        if (period.excited !== undefined) emotions.excited = period.excited || 0;
        if (period.neutral !== undefined) emotions.neutral = period.neutral || 0;
        
        return {
          period: period.period,
          emotions: emotions
        };
      });
      
      setTimelineData(normalizedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  // Helper to get emotions object - always returns a valid object
  const getEmotionsFromPeriod = (period: TimelineDataPoint): Record<string, number> => {
    // Ensure emotions exists and is an object
    if (period.emotions && typeof period.emotions === 'object' && !Array.isArray(period.emotions)) {
      return period.emotions;
    }
    // Fallback to empty object if emotions is missing or invalid
    return {};
  };

  const getTotalForPeriod = (period: TimelineDataPoint) => {
    const emotions = getEmotionsFromPeriod(period);
    return Object.values(emotions).reduce((sum, count) => sum + count, 0);
  };

  const getEmotionPercentage = (period: TimelineDataPoint, emotion: string) => {
    const total = getTotalForPeriod(period);
    if (total === 0) return 0;
    const emotions = getEmotionsFromPeriod(period);
    const value = emotions[emotion] || 0;
    return (value / total) * 100;
  };

  // Get all unique emotions across all periods for consistent colors
  const getAllEmotions = () => {
    const emotionSet = new Set<string>();
    timelineData.forEach(period => {
      const emotions = getEmotionsFromPeriod(period);
      Object.keys(emotions).forEach(emotion => emotionSet.add(emotion));
    });
    return Array.from(emotionSet).sort();
  };

  // Get color for an emotion (use standard colors if available, otherwise generate)
  const getEmotionColor = (emotion: string): string => {
    const emotionLower = emotion.toLowerCase();
    if (EMOTION_COLORS[emotionLower]) {
      return EMOTION_COLORS[emotionLower];
    }
    // Generate a color based on emotion name for non-standard emotions
    const colors = ['#9C27B0', '#FF9800', '#F44336', '#2196F3', '#4CAF50', '#00BCD4', '#FF5722', '#795548'];
    const hash = emotionLower.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (loading) {
    return <div className="text-center text-slate-600">Loading timeline...</div>;
  }

  if (error) {
    return <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100">Error: {error}</div>;
  }

  if (timelineData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-100 text-center text-slate-600">
        No timeline data available. Upload some photos to see your emotional journey!
      </div>
    );
  }

  // Format period labels for better readability
  const formatPeriodLabel = (period: string, bucket: string) => {
    if (bucket === 'month') {
      try {
        const [year, month] = period.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      } catch {
        return period;
      }
    } else if (bucket === 'week') {
      return `Week ${period}`;
    } else if (bucket === 'day') {
      try {
        const date = new Date(period);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } catch {
        return period;
      }
    }
    return period;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-slate-900">Emotional Timeline</h2>
        <div className="flex gap-2">
          {(['month', 'week', 'day'] as const).map((b) => (
            <button
              key={b}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                bucket === b
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              onClick={() => setBucket(b)}
            >
              {b[0].toUpperCase() + b.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {timelineData.map((period) => {
          const total = getTotalForPeriod(period);
          if (total === 0) return null; // Skip periods with no photos
          
          return (
            <div key={period.period} className="border border-slate-200 rounded-lg p-4 bg-slate-50 hover:bg-slate-100 transition">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-800">{formatPeriodLabel(period.period, bucket)}</h3>
                <span className="text-xs text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 font-medium">
                  {total} {total === 1 ? 'photo' : 'photos'}
                </span>
              </div>
              <div className="flex h-6 overflow-hidden rounded-lg bg-white border border-slate-200 shadow-inner">
                {Object.entries(getEmotionsFromPeriod(period))
                  .filter(([, value]) => value > 0) // Only show emotions with count > 0
                  .sort((a, b) => b[1] - a[1]) // Sort by count, descending
                  .map(([emotion, value]) => {
                    const percentage = getEmotionPercentage(period, emotion);
                    const color = getEmotionColor(emotion);
                    if (percentage === 0) return null;
                    return (
                      <div
                        key={emotion}
                        className="h-full transition-all hover:opacity-80"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: color,
                          minWidth: percentage > 0 ? '2px' : '0',
                        }}
                        title={`${emotion}: ${value} (${percentage.toFixed(1)}%)`}
                      />
                    );
                  })}
              </div>
              <div className="flex flex-wrap gap-3 mt-3 text-xs text-slate-700">
                {Object.entries(getEmotionsFromPeriod(period))
                  .filter(([, value]) => value > 0) // Only show emotions with count > 0
                  .sort((a, b) => b[1] - a[1]) // Sort by count, descending
                  .map(([emotion, value]) => {
                    const percentage = getEmotionPercentage(period, emotion);
                    const color = getEmotionColor(emotion);
                    return (
                      <div key={emotion} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                        <span className="capitalize font-medium">{emotion}: {value}</span>
                        <span className="text-slate-500">({percentage.toFixed(0)}%)</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Emotion Heatmap */}
      <div className="mt-8">
        <EmotionHeatmap userId={userId} />
      </div>
    </div>
  );
}

