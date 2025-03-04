import { TwitterBookmark } from '../types';
import { analyzeBookmark as aiServiceAnalyze, findSimilarBookmarks as aiFindSimilarBookmarks } from '../services/aiService';
import { extractLinks } from './linkExtractor';

// Simple word tokenization
const tokenize = (text: string): string[] => {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 2);
};

// Basic sentiment analysis using a small set of common words
const SENTIMENT_WORDS = {
  positive: [
    'good', 'great', 'awesome', 'excellent', 'happy', 'love', 'wonderful', 'fantastic',
    'brilliant', 'amazing', 'perfect', 'beautiful', 'exciting', 'innovative', 'helpful',
    'impressive', 'outstanding', 'superb', 'delightful', 'inspiring'
  ],
  negative: [
    'bad', 'terrible', 'awful', 'horrible', 'sad', 'hate', 'poor', 'disappointing',
    'broken', 'useless', 'annoying', 'frustrating', 'painful', 'disaster', 'failure',
    'inferior', 'worst', 'boring', 'difficult', 'confusing'
  ],
  neutral: [
    'okay', 'fine', 'average', 'normal', 'standard', 'typical', 'regular',
    'moderate', 'fair', 'acceptable', 'decent', 'usual', 'common'
  ]
};

interface SentimentScore {
  positive: number;
  negative: number;
  neutral: number;
  overall: 'positive' | 'negative' | 'neutral';
}

const analyzeSentiment = (tokens: string[]): SentimentScore => {
  const scores = {
    positive: 0,
    negative: 0,
    neutral: 0
  };

  // Weight modifiers for context
  const intensifiers = ['very', 'really', 'extremely', 'absolutely', 'totally'];
  const negators = ['not', "don't", 'never', 'no', "isn't", "aren't", "wasn't", "weren't"];

  let intensifierMultiplier = 1;
  let negationActive = false;

  tokens.forEach((token, index) => {
    // Reset modifiers for each new sentence (basic approximation)
    if (token.endsWith('.') || token.endsWith('!') || token.endsWith('?')) {
      intensifierMultiplier = 1;
      negationActive = false;
    }

    // Check for intensifiers
    if (intensifiers.includes(token)) {
      intensifierMultiplier = 1.5;
      return;
    }

    // Check for negation
    if (negators.includes(token)) {
      negationActive = true;
      return;
    }

    // Apply sentiment scoring with modifiers
    let score = intensifierMultiplier;
    if (negationActive) {
      // Flip positive/negative when negated
      if (SENTIMENT_WORDS.positive.includes(token)) {
        scores.negative += score;
      } else if (SENTIMENT_WORDS.negative.includes(token)) {
        scores.positive += score;
      }
    } else {
      if (SENTIMENT_WORDS.positive.includes(token)) {
        scores.positive += score;
      } else if (SENTIMENT_WORDS.negative.includes(token)) {
        scores.negative += score;
      } else if (SENTIMENT_WORDS.neutral.includes(token)) {
        scores.neutral += score;
      }
    }

    // Reset modifiers after applying sentiment
    intensifierMultiplier = 1;
    if (token !== token.toLowerCase()) { // Reset negation after non-lowercase word (likely new sentence)
      negationActive = false;
    }
  });

  // Determine overall sentiment
  let overall: 'positive' | 'negative' | 'neutral';
  if (scores.positive > scores.negative && scores.positive > scores.neutral) {
    overall = 'positive';
  } else if (scores.negative > scores.positive && scores.negative > scores.neutral) {
    overall = 'negative';
  } else {
    overall = 'neutral';
  }

  return {
    ...scores,
    overall
  };
};

// Extract keywords based on word frequency
const extractKeywords = (tokens: string[]): string[] => {
  const frequency: Record<string, number> = {};
  tokens.forEach(token => {
    frequency[token] = (frequency[token] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word);
};

export async function analyzeBookmark(bookmark: TwitterBookmark): Promise<Partial<TwitterBookmark>> {
  // Try AI service first
  try {
    const aiAnalysis = await aiServiceAnalyze(bookmark);
    if (aiAnalysis) {
      // Extract links from content
      const extractedLinks = await extractLinks(bookmark.content);
      
      // Combine existing tags with AI-generated topics
      const combinedTags = [...new Set([
        ...bookmark.tags,
        ...(aiAnalysis.aiTags || [])
      ])];

      return {
        sentiment: aiAnalysis.sentiment,
        tags: combinedTags,
        extractedLinks,
        summary: aiAnalysis.summary,
        aiAnalysis: {
          ...aiAnalysis,
          relatedBookmarks: []
        }
      };
    }
  } catch (error) {
    console.warn('AI analysis failed, falling back to basic analysis:', error);
  }

  // Fallback to basic analysis
  const tokens = tokenize(bookmark.content);
  const sentiment = analyzeSentiment(tokens);
  
  // Extract keywords for AI tags
  const aiTags = extractKeywords(tokens);
  const combinedTags = [...new Set([...bookmark.tags, ...aiTags])];

  // Generate summary (simple for now, using first sentence)
  const sentences = bookmark.content.split(/[.!?]+/).filter(Boolean);
  const summary = sentences[0]?.trim() || '';
  
  // Extract links from content
  const extractedLinks = await extractLinks(bookmark.content);

  return {
    sentiment,
    tags: combinedTags,
    extractedLinks,
    summary
  };
}

export async function findSimilarBookmarks(bookmark: TwitterBookmark, allBookmarks: TwitterBookmark[]): Promise<number[]> {
  try {
    return await aiFindSimilarBookmarks(bookmark, allBookmarks);
  } catch (error) {
    console.error('Failed to find similar bookmarks:', error);
    return [];
  }
}