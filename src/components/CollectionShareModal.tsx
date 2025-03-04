import React, { useState } from 'react';
import { Share2, Copy, Check, Mail, Link as LinkIcon } from 'lucide-react';
import { BookmarkStore } from '../types';

interface Props {
  store: BookmarkStore;
  collectionId: string;
  onClose: () => void;
}

export function CollectionShareModal({ store, collectionId, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  const [shareType, setShareType] = useState<'view' | 'edit'>('view');
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  
  const collection = store.nestedCollections[collectionId];
  const shareUrl = `${window.location.origin}/collections/shared/${collectionId}?type=${shareType}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleAddEmail = () => {
    if (emailInput && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      setEmails([...emails, emailInput]);
      setEmailInput('');
    }
  };

  const handleRemoveEmail = (email: string) => {
    setEmails(emails.filter(e => e !== email));
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-[500px]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-500" />
            Share Collection
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Share Type</label>
            <div className="flex gap-2">
              <button
                onClick={() => setShareType('view')}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  shareType === 'view'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'hover:bg-gray-50'
                }`}
              >
                View Only
              </button>
              <button
                onClick={() => setShareType('edit')}
                className={`flex-1 px-4 py-2 rounded-lg border ${
                  shareType === 'edit'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'hover:bg-gray-50'
                }`}
              >
                Can Edit
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Share Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-3 py-2 border rounded-lg bg-gray-50"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Share via Email</label>
            <div className="flex gap-2 mb-2">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter email address"
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddEmail}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add
              </button>
            </div>
            
            {emails.length > 0 && (
              <div className="space-y-2">
                {emails.map(email => (
                  <div
                    key={email}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg"
                  >
                    <span className="text-sm">{email}</span>
                    <button
                      onClick={() => handleRemoveEmail(email)}
                      className="text-gray-500 hover:text-red-500"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                
                <button
                  className="w-full mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  Send Invites
                </button>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-500">
            <h4 className="font-medium text-gray-700 mb-1">Collection Details</h4>
            <p>Name: {collection.name}</p>
            <p>Items: {collection.bookmarks.length}</p>
            <p>Last modified: {new Date(collection.lastModified).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}