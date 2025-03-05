import OpenAI from 'openai';
import { TwitterBookmark } from '../types';

let openai: OpenAI | null = null;

function initializeOpenAI() {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('OpenAI API key not found in environment variables');
    return null;
  }
  
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true
  });
}

export async function analyzeBookmark(bookmark: TwitterBookmark) {
  try {
    if (!openai) {
      openai = initializeOpenAI();
      if (!openai) {
        throw new Error('OpenAI client not initialized - missing API key');
      }
    }

    const response = await openai!.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant helping analyze Twitter bookmarks. 
          Analyze the content for key topics, sentiment, and provide a concise summary.
          Also suggest relevant collections, tags, and estimate reading difficulty.`
        },
        {
          role: "user",
          content: `Tweet content: "${bookmark.content}"
          Current tags: ${bookmark.tags.join(', ')}
          Author: ${bookmark.postedBy}
          Analyze and provide the following in JSON format:
          1. A concise summary (max 2 sentences)
          2. Key topics (max 5)
          3. Suggested collections
          4. Reading difficulty (easy/medium/hard)
          5. Estimated read time in minutes
          6. Sentiment analysis (positive/negative/neutral)
          7. Suggested tags (5-8 relevant tags that would be useful for categorization)
          
          Example format:
          {
            "summary": "Brief summary here",
            "topics": ["topic1", "topic2"],
            "collections": ["collection1"],
            "difficulty": "easy",
            "readTime": 2,
            "sentiment": "positive",
            "suggestedTags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
          }`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500
    });

    if (!response.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI API');
    }

    let analysis;
    try {
      analysis = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', parseError);
      throw new Error('Invalid JSON response from OpenAI API');
    }

    if (!analysis) throw new Error('Empty analysis result');
    
    return {
      aiAnalysis: {
        summary: analysis.summary,
        keyTopics: analysis.topics || [],
        suggestedCollections: analysis.collections || [],
        readingDifficulty: analysis.difficulty as 'easy' | 'medium' | 'hard',
        estimatedReadTime: analysis.readTime || 1,
        relatedBookmarks: []
      },
      sentiment: analysis.sentiment as 'positive' | 'negative' | 'neutral',
      summary: analysis.summary,
      aiTags: analysis.topics || [],
      suggestedTags: analysis.suggestedTags || []
    };
  } catch (error) {
    console.error('AI Analysis failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

export async function generateSimilarBookmarks(bookmark: TwitterBookmark, allBookmarks: TwitterBookmark[]) {
  try {
    if (!openai) {
      openai = initializeOpenAI();
      if (!openai) throw new Error('OpenAI client not initialized - missing API key');
    }
    const response = await openai!.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "Find similar bookmarks based on content, topics, and sentiment."
        },
        {
          role: "user",
          content: `Find similar bookmarks to:
          Content: "${bookmark.content}"
          Topics: ${bookmark.aiAnalysis?.keyTopics.join(', ')}
          
          Available bookmarks:
          ${allBookmarks.map(b => `- ${b.content}`).join('\n')}
          
          Return the indices of the 3 most similar bookmarks as a JSON array.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 150
    });

    const content = response.choices[0].message.content;
    if (!content) return [];
    
    const result = JSON.parse(content);
    return result.similarBookmarks as number[];
  } catch (error) {
    console.error('Similar bookmarks generation failed:', error);
    return [];
  }
}

export async function suggestCollections(bookmarks: TwitterBookmark[]) {
  try {
    if (!openai) {
      openai = initializeOpenAI();
      if (!openai) throw new Error('OpenAI client not initialized - missing API key');
    }
    const response = await openai!.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "Suggest meaningful collections based on bookmark content and patterns."
        },
        {
          role: "user",
          content: `Analyze these bookmarks and suggest collections:
          ${bookmarks.map(b => `
            Content: "${b.content}"
            Topics: ${b.aiAnalysis?.keyTopics.join(', ')}
          `).join('\n')}
          
          Return suggestions as a JSON array of objects with name and description.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    if (!content) return [];
    
    const result = JSON.parse(content);
    return result.collections as Array<{ name: string; description: string }>;
  } catch (error) {
    console.error('Collection suggestions failed:', error);
    return [];
  }
}

export async function suggestTags(bookmarks: TwitterBookmark[]) {
  try {
    if (!openai) {
      openai = initializeOpenAI();
      if (!openai) {
        throw new Error('OpenAI client not initialized - missing API key');
      }
    }

    const response = await openai!.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant helping organize Twitter bookmarks.
          Analyze the content and existing tags to suggest new, relevant tags.
          Focus on technical topics, themes, and categories.`
        },
        {
          role: "user",
          content: `Analyze these bookmarks and suggest tags:
          ${bookmarks.map(b => `
            Content: "${b.content}"
            Current tags: ${b.tags.join(', ')}
            AI topics: ${b.aiAnalysis?.keyTopics.join(', ')}
          `).join('\n')}
          
          Return suggestions as a JSON object with bookmarkId and suggestedTags array.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 500
    });

    const content = response.choices[0].message.content;
    if (!content) return [];
    
    const result = JSON.parse(content);
    return result.suggestions as Array<{
      bookmarkId: string;
      suggestedTags: string[];
    }>;
  } catch (error) {
    console.error('Tag suggestions failed:', error);
    return [];
  }
}

export async function generateTagGroups(bookmarks: TwitterBookmark[]) {
  try {
    if (!openai) {
      openai = initializeOpenAI();
      if (!openai) {
        throw new Error('OpenAI client not initialized - missing API key');
      }
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant helping organize Twitter bookmarks.
          Analyze the content and existing tags to suggest meaningful tag groups.
          Focus on technical topics, themes, and categories.`
        },
        {
          role: "user",
          content: `Analyze these bookmarks and suggest tag groups:
          ${bookmarks.map(b => `
            Content: "${b.content}"
            Current tags: ${b.tags.join(', ')}
            AI topics: ${b.aiAnalysis?.keyTopics.join(', ')}
          `).join('\n')}
          
          Return suggestions as a JSON object with groups containing:
          - name
          - description
          - color (tailwind color class)
          - icon (lucide icon name)
          - tags (array of related tags)`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.choices[0].message.content;
    if (!content) return [];
    
    const result = JSON.parse(content);
    return result.groups as Array<{
      name: string;
      description: string;
      color: string;
      icon: string;
      tags: string[];
    }>;
  } catch (error) {
    console.error('Tag group generation failed:', error);
    return [];
  }
}

export async function findSimilarBookmarks(bookmark: TwitterBookmark, allBookmarks: TwitterBookmark[]) {
  try {
    if (!openai) {
      openai = initializeOpenAI();
      if (!openai) {
        throw new Error('OpenAI client not initialized - missing API key');
      }
    }

    const response = await openai!.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "Find similar bookmarks based on content, topics, and sentiment."
        },
        {
          role: "user",
          content: `Find similar bookmarks to:
          Content: "${bookmark.content}"
          Topics: ${bookmark.aiAnalysis?.keyTopics.join(', ')}
          Tags: ${bookmark.tags?.join(', ') || ''}
          
          Available bookmarks:
          ${allBookmarks.map((b, i) => `${i}: ${b.content}`).join('\n')}
          
          Return the indices of the 3 most similar bookmarks as a JSON array.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
      max_tokens: 150
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.similarBookmarks as number[];
  } catch (error) {
    if (error instanceof Error) {
      console.error('Similar bookmarks search failed:', error.message);
    } else {
      console.error('Similar bookmarks search failed:', error);
    }
    return [];
  }
}