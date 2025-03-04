import { TwitterBookmark } from '../types';
import Papa from 'papaparse';

const STORAGE_KEY = 'twitter-bookmarks-csv';

function sanitizeUrl(url: string): string {
  try {
    if (!url) return '';
    // Remove any whitespace and quotes
    url = url.trim().replace(/['"]/g, '');
    // Check if it's a valid URL
    new URL(url);
    return url;
  } catch {
    return '';
  }
}

export async function parseCSV(file: File): Promise<TwitterBookmark[]> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.toLowerCase().trim(),
      complete: (results) => {
        const bookmarks = results.data.map((row: any, index) => ({
          id: `${index}-${Date.now()}`,
          tweetDate: row['tweet date']?.trim() || new Date().toISOString(),
          postedBy: row['posted by']?.trim() || '',
          postedByProfilePic: sanitizeUrl(row['posted by profile pic']),
          postedByProfileUrl: sanitizeUrl(row['posted by profile url']),
          postedByHandle: row['posted by twitter handle']?.trim() || '',
          tweetUrl: sanitizeUrl(row['tweet url']),
          content: row['content']?.trim() || '',
          tags: (row['tags'] || '').split(',').map((tag: string) => tag.trim()).filter(Boolean),
          comments: row['comments']?.trim() || '',
          media: sanitizeUrl(row['media']),
          readingStatus: 'unread',
          priority: 'medium',
          readingTime: Math.ceil(row['content']?.length / 200) || 1, // Rough estimate: 200 chars per minute
        }));
        resolve(bookmarks);
      },
      error: (error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      }
    });
  });
}

export async function saveCSV(file: File): Promise<void> {
  const text = await file.text();
  localStorage.setItem(STORAGE_KEY, text);
}

export async function loadSavedCSV(): Promise<TwitterBookmark[] | null> {
  try {
    const savedCSV = localStorage.getItem(STORAGE_KEY);
    if (!savedCSV) {
      return null;
    }
    const file = new File([savedCSV], 'bookmarks.csv', { type: 'text/csv' });
    return await parseCSV(file);
  } catch (error) {
    console.error('Error loading saved CSV:', error);
    return null;
  }
}