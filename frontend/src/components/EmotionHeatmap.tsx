import { useState, useEffect, useMemo } from 'react';
import { uploadService } from '../services/api';
import type { Photo } from '../types';

interface EmotionHeatmapProps {
  userId: string;
}

// Emotion categories (same as Collage component)
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

const CATEGORY_COLORS: Record<string, string> = {
  'happy': '#4CAF50',
  'sad': '#2196F3',
  'calm': '#9C27B0',
  'stressed': '#FF9800',
  'excited': '#F44336',
  'neutral': '#9E9E9E',
  'nostalgic': '#E91E63',
  'contemplative': '#00BCD4',
  'romantic': '#FF69B4',
  'playful': '#FFC107',
};

// Find the category for an emotion
function findEmotionCategory(emotion: string): string {
  const emotionLower = emotion.toLowerCase();
  
  for (const [category, emotions] of Object.entries(EMOTION_GROUPS)) {
    if (emotions.includes(emotionLower)) {
      return category;
    }
  }
  
  return emotionLower;
}

export function EmotionHeatmap({ userId }: EmotionHeatmapProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('happy');
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  useEffect(() => {
    loadPhotos();
  }, [userId]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const data = await uploadService.getPhotos(userId);
      setPhotos(data);
    } catch (err) {
      console.error('Failed to load photos for heatmap:', err);
    } finally {
      setLoading(false);
    }
  };

  // Group photos by date and category
  const heatmapData = useMemo(() => {
    const data: Record<string, number> = {};
    
    photos.forEach(photo => {
      if (!photo.uploaded_at) return;
      
      // Parse date (format: YYYY-MM-DD or ISO string)
      let dateStr: string;
      try {
        // Handle both ISO string and YYYY-MM-DD format
        let date: Date;
        if (typeof photo.uploaded_at === 'string' && photo.uploaded_at.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Already in YYYY-MM-DD format
          dateStr = photo.uploaded_at;
        } else {
          date = new Date(photo.uploaded_at);
          if (isNaN(date.getTime())) return; // Invalid date
          // Use local date to avoid timezone issues
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          dateStr = `${year}-${month}-${day}`;
        }
      } catch {
        return;
      }
      
      // Get emotions from photo
      const emotions = photo.emotions || (photo.emotion ? [photo.emotion] : []);
      
      if (emotions.length === 0) {
        // No emotions, count as neutral
        if (selectedCategory === 'neutral') {
          data[dateStr] = (data[dateStr] || 0) + 1;
        }
        return;
      }
      
      // Check if any emotion matches the selected category
      const matchesCategory = emotions.some(emotion => {
        if (!emotion) return false;
        const emotionLower = emotion.toLowerCase().trim();
        const category = findEmotionCategory(emotionLower);
        
        // Debug: log emotion matching
        if (selectedCategory === 'happy') {
          console.log(`Checking emotion "${emotionLower}" -> category "${category}" matches "${selectedCategory}": ${category === selectedCategory}`);
        }
        
        return category === selectedCategory;
      });
      
      if (matchesCategory) {
        data[dateStr] = (data[dateStr] || 0) + 1;
        // Debug: log when we add to data
        if (selectedCategory === 'happy') {
          console.log(`Added photo to heatmapData for ${dateStr}, total count now: ${data[dateStr]}`);
        }
      }
    });
    
    // Debug: log some stats and sample dates
    const totalDays = Object.keys(data).length;
    const totalPhotos = Object.values(data).reduce((sum, count) => sum + count, 0);
    if (totalDays > 0) {
      console.log(`Heatmap data for ${selectedCategory}: ${totalDays} days with ${totalPhotos} photos`);
      const sampleDates = Object.keys(data).slice(0, 3);
      console.log('Sample dates in heatmapData:', sampleDates, 'with counts:', sampleDates.map(d => data[d]));
    }
    
    return data;
  }, [photos, selectedCategory]);

  // Generate calendar grid (December only for now)
  const calendarGrid = useMemo(() => {
    const grid: Array<Array<{ date: string; count: number; dateObj: Date; isFuture: boolean }>> = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get current year and December
    const currentYear = today.getFullYear();
    const decemberStart = new Date(currentYear, 11, 1); // Month 11 = December (0-indexed)
    
    // Align to start of week (Sunday = 0)
    const dayOfWeek = decemberStart.getDay();
    const startDate = new Date(decemberStart);
    startDate.setDate(startDate.getDate() - dayOfWeek);
    
    // End of December
    const decemberEnd = new Date(currentYear, 11, 31);
    const endDate = new Date(decemberEnd);
    endDate.setDate(endDate.getDate() + (6 - decemberEnd.getDay())); // End of week
    
    let currentDate = new Date(startDate);
    // Use local date for today comparison
    const todayYear = today.getFullYear();
    const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
    const todayDay = String(today.getDate()).padStart(2, '0');
    const todayStrLocal = `${todayYear}-${todayMonth}-${todayDay}`;
    
    // Debug: log sample dates from heatmapData
    const sampleDates = Object.keys(heatmapData).slice(0, 5);
    if (sampleDates.length > 0) {
      console.log('Sample dates in heatmapData:', sampleDates);
      console.log('Sample counts:', sampleDates.map(d => heatmapData[d]));
    }
    
    // Generate weeks until we've covered all of December
    while (currentDate <= endDate) {
      const weekData: Array<{ date: string; count: number; dateObj: Date; isFuture: boolean }> = [];
      
      // 7 days per week
      for (let day = 0; day < 7; day++) {
        // Use local date to match the format in heatmapData
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const dayNum = String(currentDate.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayNum}`;
        
        const isFuture = dateStr > todayStrLocal;
        const count = isFuture ? 0 : (heatmapData[dateStr] || 0);
        
        // Debug: log if we find a match
        if (count > 0) {
          console.log(`Calendar grid match: ${dateStr} has count ${count}, heatmapData value: ${heatmapData[dateStr]}`);
        }
        
        weekData.push({
          date: dateStr,
          count,
          dateObj: new Date(currentDate),
          isFuture
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      grid.push(weekData);
    }
    
    return grid;
  }, [heatmapData]);

  // Get intensity level (0-4) based on count
  const getIntensity = (count: number): number => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 5) return 3;
    return 4;
  };

  // Get color based on intensity
  const getColor = (intensity: number): string => {
    if (intensity === 0) return '#ebedf0'; // Light grey (no activity)
    const baseColor = CATEGORY_COLORS[selectedCategory] || '#4CAF50';
    
    // Convert hex to RGB
    const r = parseInt(baseColor.slice(1, 3), 16);
    const g = parseInt(baseColor.slice(3, 5), 16);
    const b = parseInt(baseColor.slice(5, 7), 16);
    
    // Create opacity levels - ensure we have valid index
    const opacityLevels = [0.3, 0.5, 0.7, 0.9, 1.0];
    const opacity = intensity > 0 && intensity <= opacityLevels.length 
      ? opacityLevels[intensity - 1] 
      : 1.0;
    
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  // Get max count for reference
  const maxCount = useMemo(() => {
    return Math.max(...Object.values(heatmapData), 1);
  }, [heatmapData]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
        <div className="text-center text-slate-600">Loading heatmap...</div>
      </div>
    );
  }

  const availableCategories = Object.keys(EMOTION_GROUPS);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-lg font-semibold text-slate-900">Emotion Heatmap</h2>
        <div className="flex flex-wrap gap-2">
          {availableCategories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
              style={selectedCategory === category ? {
                backgroundColor: CATEGORY_COLORS[category] || '#4CAF50',
                borderColor: CATEGORY_COLORS[category] || '#4CAF50',
              } : {}}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-1 min-w-max">
          {/* Month labels */}
          <div className="flex flex-col gap-1 mr-2">
            <div className="h-3"></div>
            {calendarGrid.map((week, weekIndex) => {
              const firstDay = week[0].dateObj;
              const month = firstDay.toLocaleDateString('en-US', { month: 'short' });
              // Show month label if this is the first week, or if the first day of the week is in the first 7 days of its month
              const isFirstWeekOfMonth = firstDay.getDate() <= 7;
              const prevWeek = weekIndex > 0 ? calendarGrid[weekIndex - 1][0] : null;
              const isNewMonth = !prevWeek || prevWeek.dateObj.getMonth() !== firstDay.getMonth();
              
              if (weekIndex === 0 || (isNewMonth && isFirstWeekOfMonth)) {
                return (
                  <div key={weekIndex} className="h-3 text-xs text-slate-600 flex items-center">
                    {month}
                  </div>
                );
              }
              return <div key={weekIndex} className="h-3"></div>;
            })}
          </div>

          {/* Calendar grid */}
          <div className="flex gap-1">
            {calendarGrid.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  const intensity = getIntensity(day.count);
                  const color = getColor(intensity);
                  
                  // Compare dates using string format to avoid timezone issues
                  const today = new Date();
                  const todayYear = today.getFullYear();
                  const todayMonth = String(today.getMonth() + 1).padStart(2, '0');
                  const todayDay = String(today.getDate()).padStart(2, '0');
                  const todayStr = `${todayYear}-${todayMonth}-${todayDay}`;
                  
                  const isToday = day.date === todayStr;
                  
                  // Force re-render with explicit style
                  const style: React.CSSProperties = {
                    backgroundColor: color,
                    width: '11px',
                    height: '11px',
                    borderRadius: '2px',
                    border: isToday ? '2px solid #000' : 'none',
                    opacity: day.isFuture ? 0.3 : 1,
                    display: 'block',
                  };
                  
                  // Debug: log color for days with data
                  if (day.count > 0) {
                    console.log(`Day ${day.date}: count=${day.count}, intensity=${intensity}, color=${color}, isFuture=${day.isFuture}`);
                  }
                  
                  return (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className="transition-all cursor-pointer hover:ring-2 hover:ring-slate-400 hover:ring-offset-1"
                      style={style}
                      title={day.isFuture ? 'Future date' : `${day.date}: ${day.count} ${selectedCategory} photo${day.count !== 1 ? 's' : ''}`}
                      onMouseEnter={() => {
                        if (!day.isFuture) {
                          setHoveredDate(day.date);
                        }
                      }}
                      onMouseLeave={() => setHoveredDate(null)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-200">
        <div className="flex items-center gap-2">
          <span>Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: getColor(level) }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
        {hoveredDate && (
          <div className="font-medium">
            {(() => {
              // Parse the date string (YYYY-MM-DD) and format it
              const [year, month, day] = hoveredDate.split('-');
              const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
              return date.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              });
            })()}: {heatmapData[hoveredDate] || 0} {selectedCategory} photo{(heatmapData[hoveredDate] || 0) !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}

