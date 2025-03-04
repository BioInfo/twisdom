import React, { useState, useMemo } from 'react';
import { FolderPlus, Folder, X, Plus, Share2, Trash2, Edit2, FolderOpen } from 'lucide-react';
import { TwitterBookmark, BookmarkStore } from '../types';
import { CollectionShareModal } from '../components/CollectionShareModal';
import { CollectionTree } from '../components/CollectionTree';

interface Props {
  store: BookmarkStore;
  onUpdateStore: (store: BookmarkStore) => void;
  bookmarks: TwitterBookmark[];
}

export function CollectionsPage({ store, onUpdateStore, bookmarks }: Props) {
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [parentCollection, setParentCollection] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [sharingCollection, setSharingCollection] = useState<string | null>(null);

  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;
    
    const id = `collection-${Date.now()}`;
    onUpdateStore({
      ...store,
      nestedCollections: {
        ...store.nestedCollections,
        [id]: {
          name: newCollectionName,
          bookmarks: [],
          children: [],
          order: Object.keys(store.nestedCollections).length,
          parentId: parentCollection,
          color: 'blue',
          lastModified: new Date().toISOString()
        }
      }
    });
    
    if (parentCollection) {
      onUpdateStore({
        ...store,
        nestedCollections: {
          ...store.nestedCollections,
          [parentCollection]: {
            ...store.nestedCollections[parentCollection],
            children: [...store.nestedCollections[parentCollection].children, id]
          }
        }
      });
    }
    
    setNewCollectionName('');
    setShowNewCollectionModal(false);
    setParentCollection(null);
  };

  const handleDrop = (collectionId: string, bookmarkId: string) => {
    const collection = store.nestedCollections[collectionId];
    if (!collection) return;

    onUpdateStore({
      ...store,
      nestedCollections: {
        ...store.nestedCollections,
        [collectionId]: {
          ...collection,
          bookmarks: [...collection.bookmarks, bookmarkId],
          lastModified: new Date().toISOString()
        }
      }
    });
  };

  const sortedCollections = useMemo(() => {
    return Object.entries(store.nestedCollections)
      .sort(([, a], [, b]) => (a.order || 0) - (b.order || 0))
      .map(([id]) => id);
  }, [store.nestedCollections]);

  const selectedBookmarks = selectedCollection
    ? store.nestedCollections[selectedCollection]?.bookmarks
        .map(id => bookmarks.find(b => b.id === id))
        .filter((b): b is TwitterBookmark => b !== undefined)
    : [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold flex items-center">
              <FolderPlus className="w-5 h-5 mr-2" />
              Collections
            </h2>
            <button
              onClick={() => setShowNewCollectionModal(true)}
              className="p-2 text-blue-500 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          <CollectionTree
            store={store}
            onUpdateStore={onUpdateStore}
            onDrop={handleDrop} 
            sortedCollections={sortedCollections}
          />
        </div>
        
        {selectedCollection && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <FolderOpen className="w-5 h-5 mr-2" />
                {store.nestedCollections[selectedCollection].name}
                {store.nestedCollections[selectedCollection].sharing && (
                  <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                    Shared
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSharingCollection(selectedCollection)}
                  className="p-2 text-gray-500 hover:text-blue-500 rounded-lg hover:bg-gray-50"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedBookmarks.map(bookmark => (
                <div
                  key={bookmark.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={bookmark.postedByProfilePic}
                      alt={bookmark.postedBy}
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{bookmark.postedBy}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {bookmark.content}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveFromCollection(selectedCollection, bookmark.id)}
                      className="p-1 text-gray-500 hover:text-red-500"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {showNewCollectionModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[400px]">
            <h3 className="text-lg font-semibold mb-4">Create New Collection</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter collection name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Parent Collection (Optional)</label>
                <select
                  value={parentCollection || ''}
                  onChange={(e) => setParentCollection(e.target.value || null)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  {Object.entries(store.nestedCollections).map(([id, collection]) => (
                    <option key={id} value={id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowNewCollectionModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateCollection}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {sharingCollection && (
        <CollectionShareModal
          store={store}
          collectionId={sharingCollection}
          onClose={() => setSharingCollection(null)}
        />
      )}
    </div>
  );
}