import { useState, useRef, useEffect } from 'react';
import { PhotoGallery } from './components/PhotoGallery';
import { Timeline } from './components/Timeline';
import { AdminAnalytics } from './components/AdminAnalytics';
import { Camera } from './components/Camera';
import { Collage } from './components/Collage';
import { searchService, uploadService } from './services/api';
import type { Photo } from './types';
import { loadEmojiMap } from './utils/emotions';

type Tab = 'gallery' | 'timeline' | 'admin' | 'camera' | 'collage';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('gallery');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const userId = 'default';
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [searchEmotion, setSearchEmotion] = useState('');
  const [searchFromDate, setSearchFromDate] = useState('');
  const [searchToDate, setSearchToDate] = useState('');
  const [searchResults, setSearchResults] = useState<Photo[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
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
    // Reload emotions when photos are refreshed
  }, [refreshTrigger]);

  // Load emoji map from backend on app start
  useEffect(() => {
    loadEmojiMap();
  }, []);

  // Live search as user types (debounced)
  useEffect(() => {
    // Only search if there's a query (at least 2 characters) and no active filters
    if (searchQuery.trim().length < 2) {
      // If query is too short, clear results if we're not using filters
      if (!searchEmotion && !searchFromDate && !searchToDate) {
        setSearchResults(null);
      }
      return;
    }

    // Debounce: wait 500ms after user stops typing
    const timeoutId = setTimeout(() => {
      const performLiveSearch = async () => {
        try {
          const emotionToSearch = searchEmotion || searchQuery.trim().toLowerCase();
          const results = await searchService.searchPhotos(
            userId,
            emotionToSearch,
            searchFromDate || undefined,
            searchToDate || undefined
          );
          setSearchResults(results);
          setActiveTab('gallery');
        } catch (err) {
          console.error('Live search failed:', err);
          // Don't set empty array on error, just log it
        }
      };
      performLiveSearch();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, searchEmotion, searchFromDate, searchToDate, userId]);

  const handleUploadSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    setActiveTab('gallery');
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    try {
      await uploadService.uploadPhoto(userId, file);
      handleUploadSuccess();
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const getCurrentDateRange = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return `${yesterday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() && !searchEmotion && !searchFromDate && !searchToDate) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      // Use searchQuery as emotion if no emotion filter is set, otherwise use the emotion filter
      const emotionToSearch = searchEmotion || (searchQuery.trim() ? searchQuery.trim().toLowerCase() : undefined);

      const results = await searchService.searchPhotos(
        userId,
        emotionToSearch,
        searchFromDate || undefined,
        searchToDate || undefined
      );
      setSearchResults(results);
      setActiveTab('gallery');
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchEmotion('');
    setSearchFromDate('');
    setSearchToDate('');
    setSearchResults(null);
    setShowSearchFilters(false);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#f5f5f7] px-4 lg:px-8 xl:px-12 backdrop-blur-sm border-b border-slate-200">
        <div className="px-6 py-3 flex items-center gap-4">
          {/* Left Navigation Icons */}
          {/* name of the app */}
          <p className="mr-8 text-md font-semibold text-slate-900 whitespace-nowrap">AI EmotionBank</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('gallery');
                clearSearch();
              }}
              className={`p-2 rounded-lg transition ${activeTab === 'gallery' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
              title="Library"
            >
              <img src="/library.svg" alt="Library" className="w-5 h-5" />
            </button>
            {/* open users camera */}
            <button
              onClick={() => {
                setActiveTab('camera');
                clearSearch();
              }}
              className="p-2 rounded-lg transition hover:bg-slate-50"
              title="Camera"
            >
              <img src="/camera.svg" alt="Camera" className="w-5 h-5" />
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg transition hover:bg-slate-50"
              title="Upload"
            >
              <img src="/upload.svg" alt="Upload" className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setActiveTab('collage');
                clearSearch();
              }}
              className={`p-2 rounded-lg transition ${activeTab === 'collage' ? 'bg-white' : 'hover:bg-white'}`}
              title="Collage"
            >
              <img src="/collage.svg" alt="Collage" className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setActiveTab('timeline');
                clearSearch();
              }}
              className={`p-2 rounded-lg transition ${activeTab === 'timeline' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
              title="Timeline"
            >
              <img src="/timeline.svg" alt="Timeline" className="w-5 h-5" />
            </button>
            <button
              onClick={() => {
                setActiveTab('admin');
                clearSearch();
              }}
              className={`p-2 rounded-lg transition ${activeTab === 'admin' ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
              title="Analytics"
            >
              <img src="/analytics.svg" alt="Analytics" className="w-5 h-5" />
            </button>
          </div>

          {/* Center - Search Bar */}
          <div className=" ml-12 mr-4 flex-1 flex justify-center">
            {/* Search Bar */}
            <div className="relative w-full max-w-md">
              <div className="relative">
                <img
                  src="/search.svg"
                  alt="Search"
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none"
                />
                <input
                  type="text"
                  placeholder="Search photos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                  className="w-full pl-10 pr-10 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={() => setShowSearchFilters(!showSearchFilters)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded transition"
                  title="Filters"
                >
                  <img src="/filter.svg" alt="Filters" className="w-4 h-4" />
                </button>
              </div>

              {/* Filters Dropdown */}
              {showSearchFilters && (
                <div className="absolute top-full mt-2 right-0 w-72 bg-white border border-slate-200 rounded-lg shadow-lg p-4 z-50">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">Emotion</label>
                      <select
                        value={searchEmotion}
                        onChange={(e) => setSearchEmotion(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">All Emotions</option>
                        {availableEmotions.map((emotion) => (
                          <option key={emotion} value={emotion}>
                            {emotion.charAt(0).toUpperCase() + emotion.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">From Date</label>
                      <input
                        type="date"
                        value={searchFromDate}
                        onChange={(e) => setSearchFromDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 mb-1 block">To Date</label>
                      <input
                        type="date"
                        value={searchToDate}
                        onChange={(e) => setSearchToDate(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSearch}
                        disabled={isSearching}
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:bg-slate-300 transition"
                      >
                        {isSearching ? 'Searching...' : 'Search'}
                      </button>
                      <button
                        onClick={clearSearch}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Date and Action Icons */}
          <div className="flex items-center gap-4">
            {/* Date Display */}
            <h2 className="text-sm font-semibold text-slate-900 whitespace-nowrap">{getCurrentDateRange()}</h2>

            {/* Action Icons */}
            <button className="p-2 rounded-lg hover:bg-slate-50 transition" title="More options">
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content - Full Width */}
      <main className="w-full mx-0.9 ">
        {activeTab === 'gallery' && (
          <PhotoGallery
            userId={userId}
            refreshTrigger={refreshTrigger}
            searchResults={searchResults}
            searchQuery={searchQuery.trim() || searchEmotion}
            onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
          />
        )}
        {activeTab === 'timeline' && (
          <div className="max-w-6xl mx-auto px-6 py-6">
            <Timeline userId={userId} />
          </div>
        )}
        {activeTab === 'admin' && (
          <div className="max-w-6xl mx-auto px-6 py-6">
            <AdminAnalytics />
          </div>
        )}
        {activeTab === 'camera' && (
          <div className="w-full h-[calc(100vh-80px)]">
            <Camera
              userId={userId}
              onCaptureSuccess={handleUploadSuccess}
              onClose={() => setActiveTab('gallery')}
            />
          </div>
        )}
        {activeTab === 'collage' && (
          <Collage userId={userId} />
        )}
      </main>
    </div>
  );
}

export default App;
