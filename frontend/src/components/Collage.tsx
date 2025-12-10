import { useState, useEffect, useMemo } from 'react';
import { uploadService, getImageUrl } from '../services/api';
import type { Photo } from '../types';
import Stack from './Stack';

interface CollageProps {
  userId: string;
}

// Emotion similarity groups - emotions that are similar/related
const EMOTION_GROUPS: Record<string, string[]> = {
  'happy': ['happy', 'joyful', 'cheerful', 'euphoric', 'elated', 'content', 'pleased', 'glad'],
  'sad': ['sad', 'melancholic', 'sorrowful', 'down', 'depressed', 'gloomy', 'somber'],
  'calm': ['calm', 'serene', 'peaceful', 'relaxed', 'tranquil', 'zen', 'composed'],
  'stressed': ['stressed', 'anxious', 'worried', 'tense', 'nervous', 'overwhelmed', 'frazzled'],
  'excited': ['excited', 'energetic', 'enthusiastic', 'thrilled', 'pumped', 'animated'],
  'neutral': ['neutral', 'indifferent', 'unemotional', 'detached'],
  'nostalgic': ['nostalgic', 'sentimental', 'wistful', 'reminiscent'],
  'contemplative': ['contemplative', 'thoughtful', 'reflective', 'introspective'],
  'romantic': ['romantic', 'loving', 'affectionate', 'tender'],
  'playful': ['playful', 'fun', 'lighthearted', 'whimsical'],
};

// Find the group for an emotion
function findEmotionGroup(emotion: string): string {
  const emotionLower = emotion.toLowerCase();

  // Check if it's a direct match
  for (const [group, emotions] of Object.entries(EMOTION_GROUPS)) {
    if (emotions.includes(emotionLower)) {
      return group;
    }
  }

  // If no group found, use the emotion itself as the group
  return emotionLower;
}

export function Collage({ userId }: CollageProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPhotos();
  }, [userId]);

  const loadPhotos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await uploadService.getPhotos(userId);
      setPhotos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  // Group photos by similar emotions
  const groupedPhotos = useMemo(() => {
    const groups: Record<string, Photo[]> = {};

    photos.forEach(photo => {
      // Get emotions from the photo
      const emotions = photo.emotions || (photo.emotion ? [photo.emotion] : []);

      if (emotions.length === 0) {
        // No emotions, put in neutral group
        if (!groups['neutral']) groups['neutral'] = [];
        groups['neutral'].push(photo);
        return;
      }

      // Use the first emotion to determine the group
      const primaryEmotion = emotions[0];
      const group = findEmotionGroup(primaryEmotion);

      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(photo);
    });

    return groups;
  }, [photos]);


  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center text-slate-600">
          <div className="inline-block w-8 h-8 border-4 border-slate-300 border-t-blue-600 rounded-full animate-spin mb-2"></div>
          <p>Loading photos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="p-4 bg-red-50 text-red-700 rounded-lg border border-red-100 max-w-2xl mx-auto">
          Error: {error}
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="w-full h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="text-center text-slate-600">
          No photos yet. Upload some photos to create collages!
        </div>
      </div>
    );
  }

  const emotionGroupNames = Object.keys(groupedPhotos).sort();

  return (
    <div className="w-full px-6 py-6">
      <h2 className="text-2xl font-semibold text-slate-900 mb-6">Emotion Collages</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {emotionGroupNames.map((groupName) => {
          const groupPhotos = groupedPhotos[groupName];
          if (groupPhotos.length === 0) return null;

          // Create cards for the Stack component
          const cards = groupPhotos.slice(0, 10).map((photo) => (
            <img
              key={photo.id}
              src={getImageUrl(photo.file_path)}
              alt={photo.caption || 'Photo'}
              className="w-full h-full object-cover pointer-events-none"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not found%3C/text%3E%3C/svg%3E';
              }}
            />
          ));

          return (
            <div key={groupName} className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-800 capitalize">
                {groupName} ({groupPhotos.length})
              </h3>
              <div className="w-full h-96 bg-white rounded-2xl overflow-hidden">
                {cards.length > 0 ? (
                  <Stack
                    cards={cards}
                    sensitivity={150}
                    randomRotation={true}
                    animationConfig={{ stiffness: 260, damping: 20 }}
                    sendToBackOnClick={true}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    No photos
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

