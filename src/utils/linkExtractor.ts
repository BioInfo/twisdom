import { TwitterBookmark } from '../types';

const URL_REGEX = /https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&\/=]*)/g;

export async function extractLinks(content: string): Promise<TwitterBookmark['extractedLinks']> {
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

        return {
          url,
          title: url.split('/').pop() || url,
          type,
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