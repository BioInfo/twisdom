import React, { useState } from 'react';
import { FolderPlus, Folder, X, Plus } from 'lucide-react';
import { BookmarkStore, TwitterBookmark } from '../types';

interface Props {
  store: BookmarkStore;
  onUpdateStore: (store: BookmarkStore) => void;
  bookmarks: TwitterBookmark[];
}

export function CollectionsPanel({ store, onUpdateStore, bookmarks }: Props) {
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    
    onUpdateStore({
      ...store,
      collections: {
        ...store.collections,
        [newCollectionName]: []
      }
    });
    setNewCollectionName('');
  };

  const handleAddToCollection = (bookmarkId: string) => {
    if (!selectedCollection) return;
    
    onUpdateStore({
      ...store,
      collections: {
        ...store.collections,
        [selectedCollection]: [
          ...store.collections[selectedCollection],
          bookmarkId
        ]
      }
    });
  };

  const handleRemoveFromCollection = (collectionName: string, bookmarkId: string) => {
    onUpdateStore({
      ...store,
      collections: {
        ...store.collections,
        [collectionName]: store.collections[collectionName].filter(id => id !== bookmarkId)
      }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <FolderPlus className="w-5 h-5 mr-2" />
        Collections
      </h2>
      
      <div className="mb-6">
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newCollectionName}
            onChange={(e) => setNewCollectionName(e.target.value)}
            placeholder="New collection name"
            className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
          />
          <button
            onClick={handleCreateCollection}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-3">
          {Object.entries(store.collections).map(([name, bookmarkIds]) => (
            <div key={name} className="border rounded-lg p-3 dark:border-gray-600">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Folder className="w-4 h-4 mr-2" />
                  <span className="font-medium">{name}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {bookmarkIds.length} items
                </span>
              </div>
              
              <div className="space-y-2">
                {bookmarkIds.map(id => {
                  const bookmark = bookmarks.find(b => b.id === id);
                  if (!bookmark) return null;
                  
                  return (
                    <div key={id} className="flex items-center justify-between text-sm">
                      <span className="truncate flex-1">{bookmark.content}</span>
                      <button
                        onClick={() => handleRemoveFromCollection(name, id)}
                        className="text-red-500 hover:text-red-600 ml-2"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}