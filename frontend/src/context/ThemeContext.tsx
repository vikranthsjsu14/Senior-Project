import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: typeof darkColors;
}

const darkColors = {
  bg: '#0f172a',
  bgCard: '#1e293b',
  bgInput: '#0f172a',
  border: '#334155',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textDim: '#475569',
  accent: '#4ade80',
  navBg: '#1a1a2e',
};

const lightColors = {
  bg: '#f1f5f9',
  bgCard: '#ffffff',
  bgInput: '#f8fafc',
  border: '#e2e8f0',
  text: '#000000',
  textSecondary: '#000000',
  textMuted: '#000000',
  textDim: '#000000',
  accent: '#16a34a',
  navBg: '#ffffff',
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  const colors = theme === 'dark' ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
