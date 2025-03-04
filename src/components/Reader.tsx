import React, { useState, useRef, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { BookOpen, Bookmark, Highlighter, Edit, X } from 'lucide-react';
import { TwitterBookmark } from '../types';

interface Props {
  bookmark: TwitterBookmark;
  onClose: () => void;
  onUpdateProgress: (id: string, progress: number) => void;
  onAddHighlight: (id: string, highlight: TwitterBookmark['highlights'][0]) => void;
  onAddNote: (id: string, note: string) => void;
}

export function Reader({ bookmark, onClose, onUpdateProgress, onAddHighlight, onAddNote }: Props) {
  const [selectedText, setSelectedText] = useState('');
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [noteText, setNoteText] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      const progress = Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      
      if (progress > (bookmark.progress || 0)) {
        onUpdateProgress(bookmark.id, progress);
      }
    };

    contentRef.current?.addEventListener('scroll', handleScroll);
    return () => contentRef.current?.removeEventListener('scroll', handleScroll);
  }, [bookmark.id, bookmark.progress, onUpdateProgress]);

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) return;
    
    setSelectedText(selection.toString());
  };

  const addHighlight = (color: string) => {
    if (!selectedText) return;
    
    onAddHighlight(bookmark.id, {
      text: selectedText,
      color,
      timestamp: new Date().toISOString()
    });
    
    setSelectedText('');
  };

  return (
    <Dialog as="div" className="fixed inset-0 z-50" onClose={onClose} open={true}>
      <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm" />

      <div className="fixed inset-0 bg-white dark:bg-gray-900 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-4">
            <BookOpen className="w-6 h-6 text-blue-500" />
            <div>
              <h2 className="font-semibold">{bookmark.postedBy}</h2>
              <p className="text-sm text-gray-500">@{bookmark.postedByHandle}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsNoteOpen(true)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div
          ref={contentRef}
          onMouseUp={handleTextSelection}
          className="flex-1 overflow-y-auto p-8 max-w-3xl mx-auto"
        >
          <div className="prose dark:prose-invert max-w-none">
            {bookmark.content}
            
            {bookmark.media && (
              <img
                src={bookmark.media}
                alt="Tweet media"
                className="my-4 rounded-lg max-w-full"
              />
            )}
          </div>

          {bookmark.highlights?.map((highlight, index) => (
            <div
              key={index}
              className="my-2 p-2 rounded"
              style={{ backgroundColor: `${highlight.color}20` }}
            >
              <p className="text-sm">{highlight.text}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(highlight.timestamp).toLocaleString()}
              </p>
            </div>
          ))}
        </div>

        {selectedText && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex items-center gap-2">
            <button
              onClick={() => addHighlight('#fef08a')}
              className="w-6 h-6 rounded-full bg-yellow-200"
            />
            <button
              onClick={() => addHighlight('#bfdbfe')}
              className="w-6 h-6 rounded-full bg-blue-200"
            />
            <button
              onClick={() => addHighlight('#bbf7d0')}
              className="w-6 h-6 rounded-full bg-green-200"
            />
          </div>
        )}

        <Transition show={isNoteOpen} as={Fragment}>
          <Dialog
            as="div"
            className="fixed inset-0 z-50 overflow-y-auto"
            onClose={() => setIsNoteOpen(false)}
          >
            <div className="min-h-screen px-4 text-center">
              <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />

              <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
                <Dialog.Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 dark:text-white"
                >
                  Add Note
                </Dialog.Title>

                <div className="mt-4">
                  <textarea
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="w-full h-32 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                    placeholder="Write your notes here..."
                  />
                </div>

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setIsNoteOpen(false)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onAddNote(bookmark.id, noteText);
                      setNoteText('');
                      setIsNoteOpen(false);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </Dialog>
        </Transition>
      </div>
    </Dialog>
  );
}