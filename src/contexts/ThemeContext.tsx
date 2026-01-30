import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ThemePreset, UserPreferences } from '@/types';
import { getUserPreferences, saveUserPreferences } from '@/db';
import { useAuth } from './AuthContext';

interface ThemeContextType {
  themePreset: ThemePreset;
  mode: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'normal' | 'large';
  alarmSound: string;
  alarmVolume: number;
  alarmMuted: boolean;
  setThemePreset: (preset: ThemePreset) => void;
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  setAccentColor: (color: string) => void;
  setFontSize: (size: 'normal' | 'large') => void;
  setAlarmSound: (sound: string) => void;
  setAlarmVolume: (volume: number) => void;
  setAlarmMuted: (muted: boolean) => void;
  saveSettings: () => Promise<void>;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme color definitions
const themeColors: Record<ThemePreset, { primary: string; secondary: string; background: string; surface: string }> = {
  'classic-light': {
    primary: '#3b82f6',
    secondary: '#64748b',
    background: '#f8fafc',
    surface: '#ffffff',
  },
  'classic-dark': {
    primary: '#60a5fa',
    secondary: '#94a3b8',
    background: '#0f172a',
    surface: '#1e293b',
  },
  'ocean-blue': {
    primary: '#0ea5e9',
    secondary: '#38bdf8',
    background: '#f0f9ff',
    surface: '#e0f2fe',
  },
  'mint-green': {
    primary: '#10b981',
    secondary: '#34d399',
    background: '#f0fdf4',
    surface: '#dcfce7',
  },
  'warm-sand': {
    primary: '#d97706',
    secondary: '#fbbf24',
    background: '#fffbeb',
    surface: '#fef3c7',
  },
  'lavender': {
    primary: '#8b5cf6',
    secondary: '#a78bfa',
    background: '#faf5ff',
    surface: '#f3e8ff',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  
  const [themePreset, setThemePresetState] = useState<ThemePreset>('classic-light');
  const [mode, setModeState] = useState<'light' | 'dark' | 'system'>('light');
  const [accentColor, setAccentColorState] = useState('#3b82f6');
  const [fontSize, setFontSizeState] = useState<'normal' | 'large'>('normal');
  const [alarmSound, setAlarmSoundState] = useState('default');
  const [alarmVolume, setAlarmVolumeState] = useState(80);
  const [alarmMuted, setAlarmMutedState] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      if (currentUser) {
        const prefs = await getUserPreferences(currentUser.id);
        if (prefs) {
          setThemePresetState(prefs.themePreset);
          setModeState(prefs.mode);
          setAccentColorState(prefs.accentColor);
          setFontSizeState(prefs.fontSize);
          setAlarmSoundState(prefs.alarmSound);
          setAlarmVolumeState(prefs.alarmVolume);
          setAlarmMutedState(prefs.alarmMuted);
        }
      }
    };
    loadPreferences();
  }, [currentUser]);

  // Apply theme changes
  useEffect(() => {
    const root = document.documentElement;
    const colors = themeColors[themePreset];
    
    // Determine if dark mode
    let darkMode = false;
    if (mode === 'dark') {
      darkMode = true;
    } else if (mode === 'system') {
      darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    setIsDark(darkMode);

    // Apply CSS variables
    root.style.setProperty('--primary-color', accentColor || colors.primary);
    root.style.setProperty('--secondary-color', colors.secondary);
    root.style.setProperty('--background-color', darkMode ? themeColors['classic-dark'].background : colors.background);
    root.style.setProperty('--surface-color', darkMode ? themeColors['classic-dark'].surface : colors.surface);
    root.style.setProperty('--text-color', darkMode ? '#f1f5f9' : '#1e293b');
    root.style.setProperty('--text-muted', darkMode ? '#94a3b8' : '#64748b');
    root.style.setProperty('--border-color', darkMode ? '#334155' : '#e2e8f0');
    
    // Apply font size
    root.style.setProperty('--font-size-base', fontSize === 'large' ? '18px' : '16px');
    
    // Apply dark mode class
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [themePreset, mode, accentColor, fontSize]);

  const setThemePreset = useCallback((preset: ThemePreset) => {
    setThemePresetState(preset);
    // Update accent color to match preset
    setAccentColorState(themeColors[preset].primary);
  }, []);

  const setMode = useCallback((m: 'light' | 'dark' | 'system') => {
    setModeState(m);
  }, []);

  const setAccentColor = useCallback((color: string) => {
    setAccentColorState(color);
  }, []);

  const setFontSize = useCallback((size: 'normal' | 'large') => {
    setFontSizeState(size);
  }, []);

  const setAlarmSound = useCallback((sound: string) => {
    setAlarmSoundState(sound);
  }, []);

  const setAlarmVolume = useCallback((volume: number) => {
    setAlarmVolumeState(volume);
  }, []);

  const setAlarmMuted = useCallback((muted: boolean) => {
    setAlarmMutedState(muted);
  }, []);

  const saveSettings = useCallback(async () => {
    if (currentUser) {
      const prefs: UserPreferences = {
        userId: currentUser.id,
        themePreset,
        mode,
        accentColor,
        fontSize,
        alarmSound,
        alarmVolume,
        alarmMuted,
      };
      await saveUserPreferences(prefs);
    }
  }, [currentUser, themePreset, mode, accentColor, fontSize, alarmSound, alarmVolume, alarmMuted]);

  return (
    <ThemeContext.Provider
      value={{
        themePreset,
        mode,
        accentColor,
        fontSize,
        alarmSound,
        alarmVolume,
        alarmMuted,
        setThemePreset,
        setMode,
        setAccentColor,
        setFontSize,
        setAlarmSound,
        setAlarmVolume,
        setAlarmMuted,
        saveSettings,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
