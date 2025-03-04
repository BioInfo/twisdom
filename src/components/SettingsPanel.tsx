import React from 'react';
import { Settings, Brain, Bell, BookOpen, Eye, Clock, Archive } from 'lucide-react';
import { BookmarkStore } from '../types';

interface Props {
  store: BookmarkStore;
  onUpdateStore: (store: BookmarkStore) => void;
  onClose: () => void;
}

export function SettingsPanel({ store, onUpdateStore, onClose }: Props) {
  const updateSettings = (updates: Partial<BookmarkStore['settings']>) => {
    onUpdateStore({
      ...store,
      settings: {
        ...store.settings,
        ...updates
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50">
      <div className="absolute right-0 top-0 h-full w-[400px] bg-white dark:bg-gray-800 shadow-lg p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings className="w-6 h-6" />
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* AI Settings */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-5 h-5 text-purple-500" />
              AI Features
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span>Enable AI Analysis</span>
                <input
                  type="checkbox"
                  checked={store.settings.aiEnabled}
                  onChange={(e) => updateSettings({ aiEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Auto-analyze new bookmarks</span>
                <input
                  type="checkbox"
                  checked={store.settings.autoAnalyze}
                  onChange={(e) => updateSettings({ autoAnalyze: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
              </label>
            </div>
          </section>

          {/* Reading Settings */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              Reading
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span>Default View</span>
                <select
                  value={store.settings.defaultReadingView}
                  onChange={(e) => updateSettings({ defaultReadingView: e.target.value as 'normal' | 'reader' })}
                  className="px-3 py-1 border rounded-lg"
                >
                  <option value="normal">Normal</option>
                  <option value="reader">Reader</option>
                </select>
              </label>
              <label className="flex items-center justify-between">
                <span>Mark as read on scroll</span>
                <input
                  type="checkbox"
                  checked={store.settings.markReadOnScroll}
                  onChange={(e) => updateSettings({ markReadOnScroll: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
              </label>
              <label className="flex items-center justify-between">
                <span>Track reading progress</span>
                <input
                  type="checkbox"
                  checked={store.settings.progressTrackingEnabled}
                  onChange={(e) => updateSettings({ progressTrackingEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
              </label>
            </div>
          </section>

          {/* Display Settings */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5 text-green-500" />
              Display
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span>Show media previews</span>
                <input
                  type="checkbox"
                  checked={store.settings.showMedia}
                  onChange={(e) => updateSettings({ showMedia: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
              </label>
            </div>
          </section>

          {/* Notifications */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-500" />
              Notifications
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span>Enable notifications</span>
                <input
                  type="checkbox"
                  checked={store.settings.notificationsEnabled}
                  onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })}
                  className="w-4 h-4 text-blue-600"
                />
              </label>
            </div>
          </section>

          {/* Auto-archiving */}
          <section>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Archive className="w-5 h-5 text-red-500" />
              Auto-archiving
            </h3>
            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <span>Archive after days</span>
                <input
                  type="number"
                  value={store.settings.autoArchiveAfterDays || ''}
                  onChange={(e) => updateSettings({ autoArchiveAfterDays: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-20 px-3 py-1 border rounded-lg"
                  min="1"
                  placeholder="Never"
                />
              </label>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}