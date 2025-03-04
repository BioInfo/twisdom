import { TwitterBookmark } from '../types';
import OpenAI from 'openai';

const URL_REGEX = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/g;

export async function extractLinks(content: string, getContext = false): Promise<TwitterBookmark['extractedLinks']> {
  const urls = content.match(URL_REGEX) || [];
  const extractedLinks = await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url, {
          method: 'HEAD',
          redirect: 'follow'
        });
        
        const contentType = response.headers.get('content-type') || '';
        let type: 'article' | 'image' | 'video' | 'other' = 'other';
        
        if (contentType.includes('image')) type = 'image';
        else if (contentType.includes('video')) type = 'video';
        else if (contentType.includes('text/html')) type = 'article';

        let title = url.split('/').pop() || url;
        let context = '';
        
        if (getContext && type === 'article') {
          const contextData = await fetchLinkContext(url, content);
          if (contextData.title) title = contextData.title;
          context = contextData.context || '';
        }

        return {
          url,
          title,
          type,
          context,
          lastChecked: new Date().toISOString()
        };
      } catch (error) {
        console.error(`Failed to fetch ${url}:`, error);
        return null;
      }
    })
  );
  return extractedLinks.filter((link): link is NonNullable<typeof link> => link !== null);
}

async function fetchLinkContext(url: string, tweetContent: string): Promise<{ title?: string; context?: string }> {
  try {
    // Try to fetch the page title
    const response = await fetch(url);
    const html = await response.text();
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;
    
    // Try to get context using AI if API key is available
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (apiKey) {
      try {
        const openai = new OpenAI({
          apiKey,
          dangerouslyAllowBrowser: true
        });
        
        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: "You analyze links in tweets and provide brief context about what the link is about."
            },
            {
              role: "user",
              content: `Tweet: "${tweetContent}"\nLink: ${url}\nTitle: ${title || 'Unknown'}\n\nProvide a brief 1-2 sentence context about what this link is about based on the tweet content and link URL/title.`
            }
          ],
          temperature: 0.7,
          max_tokens: 100
        });
        
        return { title, context: aiResponse.choices[0].message.content || '' };
      } catch (aiError) {
        console.warn('Failed to get AI context for link:', aiError);
      }
    }
    return { title };
  } catch (error) {
    console.error(`Failed to fetch context for ${url}:`, error);
    return {};
  }
}