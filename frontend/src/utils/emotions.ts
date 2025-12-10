/**
 * Utility functions for emotion emoji and icon mapping
 * This provides a fallback mapping while we transition to backend-provided emojis
 */

import { uploadService } from '../services/api';

// Comprehensive emotion-to-emoji mapping
// This serves as a fallback when backend doesn't provide emoji data
let EMOTION_EMOJI_MAP: Record<string, string> = {
  // Common emotions
  happy: '😊',
  sad: '😢',
  calm: '😌',
  stressed: '😰',
  excited: '🎉',
  neutral: '😐',
  angry: '😠',
  anxious: '😟',
  content: '😊',
  disappointed: '😞',
  energetic: '⚡',
  frustrated: '😤',
  grateful: '🙏',
  joyful: '😄',
  lonely: '😔',
  peaceful: '☮️',
  proud: '😎',
  relaxed: '😌',
  surprised: '😲',
  tired: '😴',
  worried: '😟',
  // Add more as needed
};

// Cache for backend emoji map
let backendEmojiMap: Record<string, string> | null = null;
let emojiMapLoaded = false;

/**
 * Load emoji mapping from backend
 * This is called once to fetch the emoji map from the server
 */
export async function loadEmojiMap(): Promise<void> {
  if (emojiMapLoaded) return;
  
  try {
    const data = await uploadService.getEmotionsWithEmoji();
    if (data.emoji_map && Object.keys(data.emoji_map).length > 0) {
      backendEmojiMap = data.emoji_map;
      // Merge with fallback map (backend takes precedence)
      EMOTION_EMOJI_MAP = { ...EMOTION_EMOJI_MAP, ...backendEmojiMap };
    }
    emojiMapLoaded = true;
  } catch (error) {
    console.warn('Failed to load emoji map from backend, using fallback:', error);
    emojiMapLoaded = true; // Mark as loaded to prevent repeated failed requests
  }
}

// Emotion to icon path mapping
const EMOTION_ICON_MAP: Record<string, string> = {
  happy: '/emotion-happy.svg',
  sad: '/emotion-sad.svg',
  calm: '/emotion-calm.svg',
  stressed: '/emotion-stressed.svg',
  excited: '/emotion-excited.svg',
  neutral: '/emotion-neutral.svg',
};

/**
 * Get emoji for an emotion
 * @param emotion - The emotion name
 * @param photoEmotionEmojis - Optional emoji map from photo data (from LLM)
 * @returns The emoji string, or a default emoji if not found
 */
export function getEmotionEmoji(emotion: string | undefined | null, photoEmotionEmojis?: Record<string, string>): string {
  if (!emotion) return '😐';
  
  const normalized = emotion.toLowerCase().trim();
  
  // Priority: 1. Photo-specific emoji from LLM, 2. Backend map, 3. Fallback map
  if (photoEmotionEmojis && photoEmotionEmojis[normalized]) {
    return photoEmotionEmojis[normalized];
  }
  
  const emoji = backendEmojiMap?.[normalized] || EMOTION_EMOJI_MAP[normalized];
  return emoji || '😐';
}

/**
 * Get icon path for an emotion
 * @param emotion - The emotion name
 * @returns The icon path, or a default icon if not found
 */
export function getEmotionIcon(emotion: string | undefined | null): string {
  if (!emotion) return '/emotion-neutral.svg';
  
  const normalized = emotion.toLowerCase().trim();
  return EMOTION_ICON_MAP[normalized] || '/emotion-neutral.svg';
}

/**
 * Get emoji for an emotion with fallback to icon
 * This is a helper that tries to get emoji first, then falls back to icon path
 */
export function getEmotionDisplay(emotion: string | undefined | null): { emoji?: string; icon?: string } {
  if (!emotion) return { emoji: '😐' };
  
  const normalized = emotion.toLowerCase().trim();
  const emoji = EMOTION_EMOJI_MAP[normalized];
  const icon = EMOTION_ICON_MAP[normalized];
  
  return {
    emoji: emoji || undefined,
    icon: icon || undefined,
  };
}

