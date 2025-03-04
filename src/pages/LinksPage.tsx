import React, { useMemo } from 'react';
import { Link2, ExternalLink, Calendar, Clock, Info, Tag } from 'lucide-react';
import { TwitterBookmark } from '../types';

interface Props {
  bookmarks: TwitterBookmark[];
}

export function LinksPage({ bookmarks }: Props) {
  const extractedLinks = useMemo(() => {
    const links = bookmarks
      .filter(b => b.extractedLinks && b.extractedLinks.length > 0)
      .flatMap(bookmark => 
        bookmark.extractedLinks!.map(link => ({
          ...link,
          bookmark,
          domain: new URL(link.url).hostname
        }))
      );

    // Group by type
    const grouped = links.reduce((acc, link) => {
      if (!acc[link.type]) acc[link.type] = [];
      acc[link.type].push(link);
      return acc;
    }, {} as Record<string, typeof links>);

    return grouped;
  }, [bookmarks]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <Link2 className="w-7 h-7 mr-3 text-blue-500" />
            Extracted Links
          </h2>
        </div>

        {Object.entries(extractedLinks).map(([type, links]) => (
          <div key={type} className="mb-8">
            <h3 className="text-xl font-semibold mb-4 capitalize">{type}s</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {links.map((link, index) => (
                <div key={index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <a 
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                      >
                        {link.title || link.url}
                        <ExternalLink className="w-4 h-4 ml-1" />
                      </a>
                      <p className="text-sm text-gray-500 mt-1">{link.domain}</p>
                      {link.context && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                            <Info className="w-3 h-3" /> Context
                          </div>
                          {link.context}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3 text-sm text-gray-600">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(link.lastChecked).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {link.bookmark.readingTime}m
                      </span>
                      {link.bookmark.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {link.bookmark.tags.slice(0, 3).map(tag => (
                            <span 
                              key={tag}
                              className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full flex items-center gap-1"
                            >
                              <Tag className="w-3 h-3" /> {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}