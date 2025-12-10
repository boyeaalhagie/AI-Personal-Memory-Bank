/**
 * Shared types for the application
 */

export interface Photo {
  id: number;
  user_id: string;
  file_path: string;
  uploaded_at: string;
  caption?: string;
  emotion?: string;
  emotions?: string[];
  emotion_emojis?: Record<string, string>; // Map of emotion name to emoji
  emotion_confidence?: number;
}

export interface TimelineDataPoint {
  period: string;
  emotions?: Record<string, number>; // Dynamic emotion counts (new format)
  // Old format fields (for backward compatibility)
  happy?: number;
  sad?: number;
  calm?: number;
  stressed?: number;
  excited?: number;
  neutral?: number;
}

export interface TimelineResponse {
  user_id: string;
  data: TimelineDataPoint[];
}

export interface UsageStats {
  total_requests: number;
  by_endpoint: Record<string, number>;
  by_service: Record<string, number>;
}

export interface AnalyticsResponse {
  summary: UsageStats;
  period_start: string;
  period_end: string;
}

