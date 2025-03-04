import { useEffect } from 'react';

export function useTheme(theme: 'light' | 'dark') {
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
}