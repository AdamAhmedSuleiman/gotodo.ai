// src/contexts/ThemeContext.tsx
import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { Theme, ThemeContextType } from '../types.js';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const storedTheme = localStorage.getItem('gotodo-theme') as Theme | null;
      if (storedTheme) {
        return storedTheme;
      }
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      console.error("Error accessing localStorage for theme:", e);
    }
    return 'light'; // Default to light
  });

  useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove(theme === 'light' ? 'dark' : 'light');
    root.classList.add(theme);

    // Apply body classes based on theme from index.html logic
    if (theme === 'dark') {
        document.body.style.backgroundColor = '#111827'; // Tailwind's gray-900
        document.body.style.color = '#d1d5db'; // Tailwind's gray-300
    } else {
        document.body.style.backgroundColor = '#f4f7f6'; // Light gray-ish (Tailwind's gray-100 is #f3f4f6)
        document.body.style.color = '#333'; // Default dark text
    }


    try {
      localStorage.setItem('gotodo-theme', theme);
    } catch (e) {
      console.error("Error saving theme to localStorage:", e);
    }
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};