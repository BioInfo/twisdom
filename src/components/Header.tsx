import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookMarked, Upload, Settings, Sun, Moon, LayoutGrid, LayoutList, Command, LineChart, FolderOpen, Link2, ImageIcon, Tag as TagIcon, LogIn, LogOut, User, ChevronDown, UserCog } from 'lucide-react';
import { SettingsPanel } from './SettingsPanel';
import { BookmarkStore } from '../types';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface Props {
  store: BookmarkStore;
  onUpdateStore: (store: BookmarkStore) => void;
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onThemeToggle: () => void;
  onViewModeToggle: () => void;
  bookmarkCount: number;
  user?: SupabaseUser | null;
  onLogin?: () => void;
  onLogout?: () => void;
}

export function Header({ 
  store, 
  onUpdateStore, 
  onFileUpload, 
  onThemeToggle, 
  onViewModeToggle, 
  bookmarkCount,
  user,
  onLogin,
  onLogout
}: Props) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const location = useLocation();
  const settingsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    function handleKeyPress(event: KeyboardEvent) {
      // Toggle settings menu with Cmd/Ctrl + ,
      if ((event.metaKey || event.ctrlKey) && event.key === ',') {
        event.preventDefault();
        setIsSettingsOpen(prev => !prev);
      }
      
      if (isSettingsOpen) {
        // Theme toggle: Cmd/Ctrl + Shift + T
        if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'T') {
          event.preventDefault();
          onThemeToggle();
        }
        // View mode toggle: Cmd/Ctrl + Shift + V
        if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key === 'V') {
          event.preventDefault();
          onViewModeToggle();
        }
        // Close with Escape
        if (event.key === 'Escape') {
          setIsSettingsOpen(false);
        }
      }
    }

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isSettingsOpen, onThemeToggle, onViewModeToggle]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if ((settingsRef.current && !settingsRef.current.contains(event.target as Node)) && (userMenuRef.current && !userMenuRef.current.contains(event.target as Node))) {
        setIsSettingsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <BookMarked className="w-8 h-8 text-blue-500" />
            <div className="flex items-center space-x-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Twitter Bookmark Manager
              </h1>
              <nav className="flex items-center space-x-4">
                <Link
                  to="/bookmarks"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === '/bookmarks'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <BookMarked className="w-5 h-5" />
                  <span>Bookmarks</span>
                </Link>
                <Link
                  to="/insights"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === '/insights'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <LineChart className="w-5 h-5" />
                  <span>Insights</span>
                </Link>
                <Link
                  to="/collections"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === '/collections'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <FolderOpen className="w-5 h-5" />
                  <span>Collections</span>
                </Link>
                <Link
                  to="/links"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === '/links'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <Link2 className="w-5 h-5" />
                  <span>Links</span>
                </Link>
                <Link
                  to="/tags"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    location.pathname === '/tags'
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  <TagIcon className="w-5 h-5" />
                  <span>Tags</span>
                </Link>
              </nav>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 mr-4">
              {bookmarkCount} bookmarks
            </span>

            {/* User authentication status */}
            {user ? (
              <div className="relative mr-4" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-800 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm truncate max-w-[150px]">{user.email}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50 transform origin-top-right transition-all duration-200 ease-out"
                  >
                    <div className="px-4 py-2 border-b dark:border-gray-700">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Account</p>
                    </div>

                    <div className="p-2">
                      <Link
                        to="/profile"
                        className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <span className="flex items-center">
                          <UserCog className="w-4 h-4 mr-3" />
                          Profile Settings
                        </span>
                      </Link>

                      {onLogout && (
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                        >
                          <span className="flex items-center">
                            <LogOut className="w-4 h-4 mr-3" />
                            Sign Out
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              onLogin && (
                <button
                  onClick={onLogin}
                  className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors mr-4"
                  aria-label="Log in"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </button>
              )
            )}

            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Settings (⌘/Ctrl + ,)"
                aria-expanded={isSettingsOpen}
                aria-controls="settings-menu"
              >
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>

              {isSettingsOpen && (
                <div
                  id="settings-menu"
                  role="menu"
                  className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg py-2 z-50 transform origin-top-right transition-all duration-200 ease-out"
                >
                  <div className="px-4 py-2 border-b dark:border-gray-700">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">User Settings</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <Command className="w-3 h-3 mr-1" />
                        <span>,</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2">
                    <button
                      onClick={() => {
                        setIsSettingsOpen(false);
                        setShowSettings(true);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      role="menuitem"
                    >
                      <span className="flex items-center">
                        <Settings className="w-4 h-4 mr-3" />
                        Settings
                      </span>
                    </button>

                    <label
                      htmlFor="csv-upload"
                      className="flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md cursor-pointer"
                      role="menuitem"
                    >
                      <span className="flex items-center">
                        <Upload className="w-4 h-4 mr-3" />
                        Upload CSV
                      </span>
                      <input
                        id="csv-upload"
                        type="file"
                        accept=".csv"
                        onChange={onFileUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      onClick={onThemeToggle}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      role="menuitem"
                    >
                      <span className="flex items-center">
                        {store.theme === 'light' ? (
                          <>
                            <Moon className="w-4 h-4 mr-3" />
                            Dark Mode
                          </>
                        ) : (
                          <>
                            <Sun className="w-4 h-4 mr-3" />
                            Light Mode
                          </>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">⇧⌘T</span>
                    </button>

                    <button
                      onClick={onViewModeToggle}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      role="menuitem"
                    >
                      <span className="flex items-center">
                        {store.viewMode === 'normal' ? (
                          <>
                            <LayoutList className="w-4 h-4 mr-3" />
                            Compact View
                          </>
                        ) : (
                          <>
                            <LayoutGrid className="w-4 h-4 mr-3" />
                            Normal View
                          </>
                        )}
                      </span>
                      <span className="text-xs text-gray-500">⇧⌘V</span>
                    </button>

                    <button
                      onClick={() => onUpdateStore({
                        ...store,
                        settings: {
                          ...store.settings,
                          showMedia: !store.settings.showMedia
                        }
                      })}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                      role="menuitem"
                    >
                      <span className="flex items-center">
                        <ImageIcon className="w-4 h-4 mr-3" />
                        {store.settings.showMedia ? 'Hide Media' : 'Show Media'}
                      </span>
                    </button>

                    {/* Authentication options */}
                    {user ? (
                      onLogout && (
                        <button
                          onClick={() => {
                            setIsSettingsOpen(false);
                            onLogout();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          role="menuitem"
                        >
                          <span className="flex items-center">
                            <LogOut className="w-4 h-4 mr-3" />
                            Sign Out
                          </span>
                        </button>
                      )
                    ) : (
                      onLogin && (
                        <button
                          onClick={() => {
                            setIsSettingsOpen(false);
                            onLogin();
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                          role="menuitem"
                        >
                          <span className="flex items-center">
                            <LogIn className="w-4 h-4 mr-3" />
                            Sign In
                          </span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
            {showSettings && (
              <SettingsPanel
                store={store}
                onUpdateStore={onUpdateStore}
                onClose={() => setShowSettings(false)}
              />
            )}
          </div>
        </div>
      </div>
    </header>
  );
}