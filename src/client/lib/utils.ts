import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(frames: number, fps: number): string {
  const seconds = frames / fps;
  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
}

export function parseColorValue(color: string): string {
  // Ensure color starts with #
  if (color.startsWith('#')) {
    return color;
  }
  return `#${color}`;
}

export function parseTags(tags: unknown): string[] {
  if (Array.isArray(tags)) {
    return tags;
  }
  if (typeof tags === 'string' && tags) {
    try {
      const parsed = JSON.parse(tags);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
