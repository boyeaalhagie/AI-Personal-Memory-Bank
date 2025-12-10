/**
 * API service layer for all backend microservices
 */

import type {
  Photo,
  TimelineDataPoint,
  TimelineResponse,
  UsageStats,
  AnalyticsResponse,
} from '../types';

// Re-export types for convenience
export type {
  Photo,
  TimelineDataPoint,
  TimelineResponse,
  UsageStats,
  AnalyticsResponse,
};

const API_BASE_URLS = {
  upload: import.meta.env.VITE_UPLOAD_SERVICE_URL || 'http://localhost:8001',
  emotion: import.meta.env.VITE_EMOTION_SERVICE_URL || 'http://localhost:8002',
  timeline: import.meta.env.VITE_TIMELINE_SERVICE_URL || 'http://localhost:8003',
  search: import.meta.env.VITE_SEARCH_SERVICE_URL || 'http://localhost:8004',
  admin: import.meta.env.VITE_ADMIN_SERVICE_URL || 'http://localhost:8005',
};

// Upload Service API
export const uploadService = {
  uploadPhoto: async (userId: string, file: File): Promise<Photo> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URLS.upload}/photos?user_id=${userId}`, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to upload service. Make sure backend services are running.');
      }
      throw error;
    }
  },

  getPhotos: async (userId: string): Promise<Photo[]> => {
    try {
      const response = await fetch(`${API_BASE_URLS.upload}/photos?user_id=${userId}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch photos: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data.photos || [];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to upload service. Make sure backend services are running.');
      }
      throw error;
    }
  },

  getEmotions: async (): Promise<string[]> => {
    try {
      const response = await fetch(`${API_BASE_URLS.upload}/emotions`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch emotions: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data.emotions || [];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to upload service. Make sure backend services are running.');
      }
      throw error;
    }
  },

  getEmotionsWithEmoji: async (): Promise<{ emotions: string[]; emoji_map: Record<string, string> }> => {
    try {
      const response = await fetch(`${API_BASE_URLS.upload}/emotions`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch emotions: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return {
        emotions: data.emotions || [],
        emoji_map: data.emoji_map || {}
      };
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to upload service. Make sure backend services are running.');
      }
      throw error;
    }
  },

  deletePhoto: async (photoId: number, userId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URLS.upload}/photos/${photoId}?user_id=${userId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to delete photo: ${response.status} ${response.statusText} - ${errorText}`);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to upload service. Make sure backend services are running.');
      }
      throw error;
    }
  },
};

// Timeline Service API
export const timelineService = {
  getTimeline: async (userId: string, bucket: 'month' | 'week' | 'day' = 'month'): Promise<TimelineResponse> => {
    try {
      const response = await fetch(`${API_BASE_URLS.timeline}/timeline?user_id=${userId}&bucket=${bucket}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch timeline: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to timeline service. Make sure backend services are running.');
      }
      throw error;
    }
  },
};

// Search Service API
export const searchService = {
  searchPhotos: async (
    userId?: string,
    emotion?: string,
    fromDate?: string,
    toDate?: string
  ): Promise<Photo[]> => {
    try {
      const params = new URLSearchParams();
      if (userId) params.append('user_id', userId);
      if (emotion) params.append('emotion', emotion);
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      
      const response = await fetch(`${API_BASE_URLS.search}/search?${params.toString()}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search failed: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      const data = await response.json();
      return data.results || [];
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to search service. Make sure backend services are running.');
      }
      throw error;
    }
  },
};

// Admin Service API (public)
export const adminService = {
  getUsageStats: async (days: number = 30): Promise<AnalyticsResponse> => {
    try {
      const response = await fetch(`${API_BASE_URLS.admin}/admin/usage?days=${days}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch stats: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Cannot connect to admin service. Make sure backend services are running.');
      }
      throw error;
    }
  },
};

// Health check
export const checkHealth = async (service: keyof typeof API_BASE_URLS): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URLS[service]}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

