import { useEffect, useState } from 'react';
import { uploadService } from '../services/api';
import type { Photo } from '../types';
import { getEmotionEmoji, getEmotionIcon } from '../utils/emotions';

interface PhotoGalleryProps {
  userId: string;
  refreshTrigger: number;
  searchResults?: Photo[] | null;
  searchQuery?: string;
  onRefresh?: () => void;
}

export function PhotoGallery({ userId, refreshTrigger, searchResults, searchQuery, onRefresh }: PhotoGalleryProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [failedIcons, setFailedIcons] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (searchResults === null) {
      loadPhotos();
    } else if (searchResults !== undefined) {
      setPhotos(searchResults);
      setLoading(false);
    }
  }, [userId, refreshTrigger, searchResults]);

  // Poll for processing photos to complete (only when not searching and there are processing photos)
  useEffect(() => {
    if (searchResults !== null) return; // Don't poll when showing search results
    if (loading) return; // Don't poll while initial load is happening

    const hasProcessingPhotos = photos.some(photo => {
      return !photo.caption && (!photo.emotion && (!photo.emotions || photo.emotions.length === 0));
    });

    if (!hasProcessingPhotos) return; // No processing photos, no need to poll

    // Poll every 3 seconds to check if processing is complete
    const interval = setInterval(() => {
      // Only reload if we're not currently loading
      if (!loading) {
        loadPhotos();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [photos, searchResults, loading]);

  const loadPhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await uploadService.getPhotos(userId);
      setPhotos(data);
      // Debug: Log photos and their emotions
      console.log('Loaded photos:', data.length);
      const withEmotions = data.filter(p => p.emotion);
      const withoutEmotions = data.filter(p => !p.emotion);
      console.log(`Photos with emotions: ${withEmotions.length}, without: ${withoutEmotions.length}`);
      if (withoutEmotions.length > 0) {
        console.log('Photos waiting for emotion tagging:', withoutEmotions.map(p => ({ id: p.id, path: p.file_path })));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
      // Keep existing photos if we have them, don't clear on error
      if (photos.length === 0) {
        setPhotos([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const getImageUrl = (filePath: string) => {
    return `http://localhost:8001/${filePath}`;
  };

  const handleDelete = async (photoId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering card click

    if (!confirm('Are you sure you want to delete this photo?')) {
      return;
    }

    setDeletingId(photoId);
    try {
      await uploadService.deletePhoto(photoId, userId);
      // Remove from local state
      setPhotos(photos.filter(p => p.id !== photoId));
      // Trigger refresh if callback provided
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete photo');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="w-full px-6 py-12 text-center text-slate-600">
        Loading photos...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-6 py-12">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 max-w-2xl mx-auto">
          <p className="font-semibold mb-2">Error: {error}</p>
          <button
            onClick={() => {
              setError(null);
              loadPhotos();
            }}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    // Show different message if this is a search result vs no photos at all
    if (searchResults !== null && searchResults !== undefined) {
      // This is a search with no results
      const searchTerm = searchQuery ? `"${searchQuery}"` : 'results';
      return (
        <div className="w-full px-6 py-12">
          <div className="max-w-2xl mx-auto text-center text-slate-600">
            No {searchTerm} found.
          </div>
        </div>
      );
    }
    // No photos at all
    return (
      <div className="w-full px-6 py-12">
        <div className="max-w-2xl mx-auto text-center text-slate-600">
          No photos yet. Upload your first photo to get started!
        </div>
      </div>
    );
  }

  const isProcessing = (photo: Photo) => {
    // Photo is still processing if it has no caption and no emotions
    return !photo.caption && (!photo.emotion && (!photo.emotions || photo.emotions.length === 0));
  };

  return (
    <div className="w-full px-6 py-6">
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 xl:columns-5 gap-4 space-y-4">
        {photos.map((photo) => {
          const processing = isProcessing(photo);
          return (
            <div key={photo.id} className="break-inside-avoid mb-4 group cursor-pointer">
              <div className="relative rounded-lg overflow-hidden bg-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <img
                  src={getImageUrl(photo.file_path)}
                  alt={photo.caption || 'Photo'}
                  className={`w-full h-auto object-cover ${processing ? 'opacity-70' : ''}`}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
                  }}
                />
                {/* Loading skeleton overlay for photos being processed */}
                {processing && (
                  <div className="absolute inset-0 z-15">
                    {/* Shimmer background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-300 via-slate-100 to-slate-300 bg-[length:200%_100%] animate-shimmer opacity-60"></div>
                    {/* Loading indicator overlay */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[2px]">
                      <div className="text-center">
                        <div className="inline-block w-8 h-8 border-4 border-white/40 border-t-white rounded-full animate-spin mb-2"></div>
                        <p className="text-white text-xs font-medium drop-shadow-lg">Analyzing...</p>
                      </div>
                    </div>
                  </div>
                )}
                {/* Hover overlay with caption */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-end z-10">
                  <div className="w-full p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    {photo.caption && (
                      <p className="text-white text-sm font-normal mb-1 line-clamp-2">{photo.caption}</p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-white/80 text-xs">
                        {new Date(photo.uploaded_at).toLocaleDateString()}
                      </p>
                      <button
                        onClick={(e) => handleDelete(photo.id, e)}
                        disabled={deletingId === photo.id}
                        className="p-1.5 hover:bg-white/20 rounded transition-colors disabled:opacity-50 z-30"
                        title="Delete photo"
                      >
                        <svg
                          className="w-4 h-4 text-white opacity-80 hover:opacity-100"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                {/* Emotion icons - display multiple emotions on hover only, above overlay */}
                {photo.emotions && photo.emotions.length > 0 && (
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1 max-w-[60%] opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                    {photo.emotions.slice(0, 3).map((emotion: string, idx: number) => {
                      const iconPath = getEmotionIcon(emotion);
                      const hasIcon = iconPath !== '/emotion-neutral.svg' && !failedIcons.has(emotion);
                      // Use emoji from photo data (from LLM) if available, otherwise fallback
                      const emoji = getEmotionEmoji(emotion, photo.emotion_emojis);
                      return (
                        <div key={idx} className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg flex items-center gap-1">
                          {/* Use icon if available, otherwise show emoji */}
                          {hasIcon ? (
                            <img
                              src={iconPath}
                              alt={emotion}
                              className="w-5 h-5"
                              style={{ filter: `drop-shadow(0 1px 2px rgba(0,0,0,0.2))` }}
                              onError={() => {
                                setFailedIcons(prev => new Set(prev).add(emotion));
                              }}
                            />
                          ) : (
                            <span className="text-sm">{emoji}</span>
                          )}
                          <span className="text-xs font-medium text-slate-700 capitalize">{emotion}</span>
                        </div>
                      );
                    })}
                    {photo.emotions.length > 3 && (
                      <div className="bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg">
                        <span className="text-xs font-medium text-slate-700">+{photo.emotions.length - 3}</span>
                      </div>
                    )}
                  </div>
                )}
                {/* Fallback to single emotion for backward compatibility */}
                {(!photo.emotions || photo.emotions.length === 0) && photo.emotion && (() => {
                  const iconPath = getEmotionIcon(photo.emotion);
                  const hasIcon = iconPath !== '/emotion-neutral.svg' && !failedIcons.has(photo.emotion);
                  // Use emoji from photo data (from LLM) if available, otherwise fallback
                  const emoji = getEmotionEmoji(photo.emotion, photo.emotion_emojis);
                  return (
                    <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-20">
                      {hasIcon ? (
                        <img
                          src={iconPath}
                          alt={photo.emotion || 'emotion'}
                          className="w-8 h-8"
                          style={{ filter: `drop-shadow(0 2px 4px rgba(0,0,0,0.2))` }}
                          onError={() => {
                            setFailedIcons(prev => new Set(prev).add(photo.emotion!));
                          }}
                        />
                      ) : (
                        <span className="text-lg">{emoji}</span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
