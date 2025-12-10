import { useState, useEffect } from 'react';
import { searchService, uploadService, getImageUrl } from '../services/api';
import type { Photo } from '../types';
import { getEmotionIcon } from '../utils/emotions';

interface SearchProps {
  userId?: string;
}

const EMOTION_COLORS: Record<string, string> = {
  happy: '#4CAF50',
  sad: '#2196F3',
  calm: '#9C27B0',
  stressed: '#FF9800',
  excited: '#F44336',
  neutral: '#9E9E9E',
};

export function Search({ userId }: SearchProps) {
  const [emotion, setEmotion] = useState<string>('');
  const [fromDate, setFromDate] = useState<string>('');
  const [toDate, setToDate] = useState<string>('');
  const [results, setResults] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [availableEmotions, setAvailableEmotions] = useState<string[]>([]);

  // Load emotions from database
  useEffect(() => {
    const loadEmotions = async () => {
      try {
        const emotions = await uploadService.getEmotions();
        setAvailableEmotions(emotions);
      } catch (err) {
        console.error('Failed to load emotions:', err);
        // Fallback to default emotions if API fails
        setAvailableEmotions(['happy', 'sad', 'calm', 'stressed', 'excited', 'neutral']);
      }
    };
    loadEmotions();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    setSearched(true);
    
    try {
      const data = await searchService.searchPhotos(
        userId || 'default', 
        emotion || undefined, 
        fromDate || undefined, 
        toDate || undefined
      );
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setEmotion('');
    setFromDate('');
    setToDate('');
    setResults([]);
    setSearched(false);
    setError(null);
  };


  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 grid place-items-center text-lg">🔍</div>
        <h2 className="text-lg font-semibold text-slate-900">Search Photos</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
        <div className="flex flex-col gap-1">
          <label htmlFor="emotion-select" className="text-sm font-semibold text-slate-700">Emotion</label>
          <select
            id="emotion-select"
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Emotions</option>
            {availableEmotions.map((emotionOption) => (
              <option key={emotionOption} value={emotionOption}>
                {emotionOption.charAt(0).toUpperCase() + emotionOption.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="from-date" className="text-sm font-semibold text-slate-700">From Date</label>
          <input
            id="from-date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="to-date" className="text-sm font-semibold text-slate-700">To Date</label>
          <input
            id="to-date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-end gap-2">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="flex-1 py-2 px-4 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 disabled:bg-slate-300 transition"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={handleClear}
            className="py-2 px-4 border border-slate-200 rounded-lg font-semibold text-slate-700 hover:bg-slate-100 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 border border-red-100 text-sm">{error}</div>}

      {searched && !loading && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-800">Results ({results.length})</h3>
          {results.length === 0 ? (
            <p className="text-slate-600 text-sm">No photos found matching your criteria.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {results.map((photo) => (
                <div key={photo.id} className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
                  <div className="relative pt-[75%] bg-slate-50">
                    <img
                      src={getImageUrl(photo.file_path)}
                      alt={photo.caption || 'Photo'}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23ddd%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23999%22 font-family=%22sans-serif%22 font-size=%2214%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3EImage not found%3C/text%3E%3C/svg%3E';
                      }}
                    />
                    {photo.emotion && (
                      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                        <img 
                          src={getEmotionIcon(photo.emotion)} 
                          alt={photo.emotion}
                          className="w-6 h-6"
                          style={{ filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.2))` }}
                        />
                      </div>
                    )}
                    {photo.emotion && (
                      <div
                        className="absolute top-2 right-2 px-3 py-1 rounded-full text-white text-xs font-semibold shadow"
                        style={{ backgroundColor: EMOTION_COLORS[photo.emotion] || '#9E9E9E' }}
                      >
                        {photo.emotion}
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-1">
                    {photo.caption && (
                      <p className="text-sm text-slate-800 italic">{photo.caption}</p>
                    )}
                    <p className="text-xs text-slate-500">
                      {new Date(photo.uploaded_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

