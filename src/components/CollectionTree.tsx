import React, { useState } from 'react';
import { FolderOpen, FolderPlus, ChevronRight, ChevronDown, MoreVertical, Share2, Pencil, Trash2, Lock, Unlock, MoveDown, MoveUp, Users } from 'lucide-react';
import { BookmarkStore } from '../types';

interface Props {
  store: BookmarkStore;
  onUpdateStore: (store: BookmarkStore) => void;
  onDrop?: (collectionId: string, bookmarkId: string) => void;
}

export function CollectionTree({ store, onUpdateStore, onDrop }: Props) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [draggedCollection, setDraggedCollection] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [editingCollection, setEditingCollection] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  const [movingCollection, setMovingCollection] = useState<string | null>(null);

  const handleToggleExpand = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    setDraggedCollection(id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    if (draggedCollection !== id) {
      setDropTarget(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData('text/plain');
    
    if (sourceId === targetId) return;
    
    // Check if target is a descendant of source
    let current = targetId;
    while (current) {
      if (current === sourceId) return;
      current = store.nestedCollections[current]?.parentId || '';
    }

    const updatedCollections = { ...store.nestedCollections };
    
    // Remove from old parent
    if (updatedCollections[sourceId].parentId) {
      const oldParent = updatedCollections[updatedCollections[sourceId].parentId!];
      oldParent.children = oldParent.children.filter(id => id !== sourceId);
    }
    
    // Add to new parent
    updatedCollections[sourceId].parentId = targetId;
    updatedCollections[targetId].children.push(sourceId);
    
    onUpdateStore({
      ...store,
      nestedCollections: updatedCollections
    });
    
    setDraggedCollection(null);
    setDropTarget(null);
  };

  const handleMoveCollection = (id: string, direction: 'up' | 'down') => {
    const collection = store.nestedCollections[id];
    const parentId = collection.parentId;
    const siblings = parentId 
      ? store.nestedCollections[parentId].children
      : Object.keys(store.nestedCollections).filter(cId => !store.nestedCollections[cId].parentId);
    
    const currentIndex = siblings.indexOf(id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= siblings.length) return;
    
    const newSiblings = [...siblings];
    [newSiblings[currentIndex], newSiblings[newIndex]] = [newSiblings[newIndex], newSiblings[currentIndex]];
    
    if (parentId) {
      onUpdateStore({
        ...store,
        nestedCollections: {
          ...store.nestedCollections,
          [parentId]: {
            ...store.nestedCollections[parentId],
            children: newSiblings
          }
        }
      });
    } else {
      // Reorder root collections by updating all parent references
      const updatedCollections = { ...store.nestedCollections };
      newSiblings.forEach((collectionId, index) => {
        updatedCollections[collectionId] = {
          ...updatedCollections[collectionId],
          order: index
        };
      });
      onUpdateStore({
        ...store,
        nestedCollections: updatedCollections
      });
    }
  };

  const handleEditCollection = (id: string, newName: string) => {
    if (!newName.trim()) return;
    
    onUpdateStore({
      ...store,
      nestedCollections: {
        ...store.nestedCollections,
        [id]: {
          ...store.nestedCollections[id],
          name: newName.trim(),
          lastModified: new Date().toISOString()
        }
      }
    });
    
    setEditingCollection(null);
    setEditedName('');
  };

  const handleDeleteCollection = (id: string) => {
    const updatedCollections = { ...store.nestedCollections };
    
    // Move children to parent
    const collection = updatedCollections[id];
    if (collection.parentId) {
      const parent = updatedCollections[collection.parentId];
      parent.children = parent.children.filter(childId => childId !== id)
        .concat(collection.children);
      
      collection.children.forEach(childId => {
        updatedCollections[childId].parentId = collection.parentId;
      });
    }
    
    delete updatedCollections[id];
    
    onUpdateStore({
      ...store,
      nestedCollections: updatedCollections
    });
  };

  const handleTogglePrivate = (id: string) => {
    onUpdateStore({
      ...store,
      nestedCollections: {
        ...store.nestedCollections,
        [id]: {
          ...store.nestedCollections[id],
          isPrivate: !store.nestedCollections[id].isPrivate,
          lastModified: new Date().toISOString()
        }
      }
    });
  };

  const renderCollection = (id: string, level = 0) => {
    const collection = store.nestedCollections[id];
    const isExpanded = expandedNodes.has(id);
    const hasChildren = collection.children.length > 0;
    
    return (
      <div key={id} className="select-none">
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg transition-colors ${
            dropTarget === id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          style={{ marginLeft: `${level * 1.5}rem` }}
          draggable
          onDragStart={(e) => handleDragStart(e, id)}
          onDragOver={(e) => handleDragOver(e, id)}
          onDrop={(e) => handleDrop(e, id)}
        >
          <button
            onClick={() => handleToggleExpand(id)}
            className={`p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
              hasChildren ? 'visible' : 'invisible'
            }`}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          
          <FolderOpen
            className={`w-5 h-5 ${
              collection.color ? `text-${collection.color}-500` : 'text-blue-500'
            }`}
          />
          
          {editingCollection === id ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={() => handleEditCollection(id, editedName)}
              onKeyPress={(e) => e.key === 'Enter' && handleEditCollection(id, editedName)}
              className="flex-1 px-2 py-1 bg-white dark:bg-gray-700 border rounded"
              autoFocus
            />
          ) : (
            <span className="flex-1">{collection.name}</span>
          )}
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => handleMoveCollection(id, 'up')}
              className={`p-1 text-gray-500 hover:text-blue-500 rounded ${
                level === 0 && !collection.parentId ? 'invisible' : ''
              }`}
              disabled={level === 0 && !collection.parentId}
            >
              <MoveUp className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleMoveCollection(id, 'down')}
              className={`p-1 text-gray-500 hover:text-blue-500 rounded ${
                level === 0 && !collection.parentId ? 'invisible' : ''
              }`}
              disabled={level === 0 && !collection.parentId}
            >
              <MoveDown className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setEditingCollection(id);
                setEditedName(collection.name);
              }}
              className="p-1 text-gray-500 hover:text-blue-500 rounded"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleTogglePrivate(id)}
              className="p-1 text-gray-500 hover:text-blue-500 rounded"
            >
              {collection.isPrivate ? (
                <Lock className="w-4 h-4" />
              ) : (
                <Unlock className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={() => handleDeleteCollection(id)}
              className="p-1 text-gray-500 hover:text-red-500 rounded"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
          
          <span className="text-sm text-gray-500">
            <div className="flex items-center gap-2">
              {collection.sharing && (
                <Users className="w-4 h-4 text-blue-500" />
              )}
              {collection.bookmarks.length} items
            </div>
          </span>
        </div>
        
        {isExpanded && collection.children.map(childId => 
          renderCollection(childId, level + 1)
        )}
      </div>
    );
  };

  const rootCollections = Object.keys(store.nestedCollections)
    .filter(id => !store.nestedCollections[id].parentId);

  return (
    <div className="space-y-1">
      {rootCollections.map(id => renderCollection(id))}
    </div>
  );
}