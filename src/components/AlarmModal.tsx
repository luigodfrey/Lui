import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import type { ActiveAlarm } from '@/types';

interface AlarmModalProps {
  alarm: ActiveAlarm;
  onAcknowledge: () => void;
  onSnooze: () => void;
  onMute: () => void;
}

export function AlarmModal({ alarm, onAcknowledge, onSnooze, onMute }: AlarmModalProps) {
  const { t } = useTranslation();
  const { alarmSound, alarmVolume, alarmMuted } = useTheme();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play alarm sound
  useEffect(() => {
    if (!alarmMuted && alarmSound !== 'none') {
      // Create audio element
      const audio = new Audio();
      // Use a default beep sound (data URI for a simple beep)
      audio.src = alarmSound === 'default' 
        ? 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjGH0fPTgjMGHm7A7+OZSA0PVanu87plHQUuh9Dz2YU2Bhxqv+zplkcODVGm5O+4ZSAEMYrO89GFNwYdcfDr4ZdJDQtPp+XysWUeBjiS1/LNfi0GI33R8tOENAcdcO/r4phJDQxPp+XyxGUhBDeOzvPXhTYGHG3A7+SaSQ0MTKjl8bllHwU2jc7z1YU1Bhxwv+zmmUgNC1Ko5O/EZSAFNo/M89CEMwYccPDs4plIDQtRp+TvvWUfBTiOzvPVhDMGHHDw7OKXSA0LUqjl8b1kHwU3jM7z1YQzBxtw8Ozhl0gNC1Ko5fG+ZSAF' 
        : alarmSound;
      audio.volume = alarmVolume / 100;
      audio.loop = true;
      audio.play().catch(() => {
        // Auto-play blocked, user will need to interact
      });
      audioRef.current = audio;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [alarmSound, alarmVolume, alarmMuted]);

  const handleAcknowledge = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onAcknowledge();
  };

  const handleSnooze = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onSnooze();
  };

  const handleMute = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    onMute();
  };

  return (
    <div className="alarm-modal">
      <div className="alarm-content">
        <div className="mb-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 mx-auto animate-pulse" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <h2 className="alarm-title">
          {t('arrival.arrivingSoon', { name: alarm.title })}
        </h2>
        {alarm.message && (
          <p className="alarm-message">{alarm.message}</p>
        )}
        <div className="alarm-buttons">
          <button 
            onClick={handleAcknowledge}
            className="alarm-btn alarm-btn-primary"
          >
            {t('arrival.acknowledge')}
          </button>
          <button 
            onClick={handleSnooze}
            className="alarm-btn alarm-btn-secondary"
          >
            {t('arrival.snooze')}
          </button>
          <button 
            onClick={handleMute}
            className="alarm-btn alarm-btn-secondary"
          >
            {t('arrival.mute')}
          </button>
        </div>
      </div>
    </div>
  );
}
