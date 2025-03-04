import { TwitterBookmark } from '../types';

// Normalize text for better matching
function normalizeText(text: string): string {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .trim();
}

// Split search query into terms
function getSearchTerms(query: string): string[] {
  return normalizeText(query)
    .split(/\s+/)
    .filter(term => term.length > 1);
}

// Score a bookmark based on search terms
function scoreBookmark(bookmark: TwitterBookmark, searchTerms: string[]): number {
  if (!searchTerms.length) return 0;

  const normalizedContent = normalizeText(bookmark.content);
  const normalizedAuthor = normalizeText(bookmark.postedBy);
  const normalizedHandle = normalizeText(bookmark.postedByHandle);
  const normalizedTags = bookmark.tags.map(normalizeText).join(' ');

  let score = 0;
  for (const term of searchTerms) {
    // Content matches
    if (normalizedContent.includes(term)) {
      score += 10;
      if (normalizedContent.startsWith(term)) score += 5;
    }

    // Author matches
    if (normalizedAuthor.includes(term)) score += 8;
    if (normalizedHandle.includes(term)) score += 8;

    // Tag matches
    if (normalizedTags.includes(term)) score += 15;

    // Exact matches bonus
    if (normalizedContent.includes(` ${term} `)) score += 5;
    if (bookmark.tags.some(tag => normalizeText(tag) === term)) score += 10;
  }

  return score;
}

export function searchBookmarks(
  bookmarks: TwitterBookmark[],
  query: string
): TwitterBookmark[] {
  const searchTerms = getSearchTerms(query);
  if (!searchTerms.length) return bookmarks;

  return bookmarks
    .map(bookmark => ({
      bookmark,
      score: scoreBookmark(bookmark, searchTerms)
    }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ bookmark }) => bookmark);
}