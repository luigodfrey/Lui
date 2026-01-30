import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { LoginPage } from '@/pages/LoginPage';
import { TasksPage } from '@/pages/TasksPage';
import { RemindersPage } from '@/pages/RemindersPage';
import { ShoppingPage } from '@/pages/ShoppingPage';
import { WhiteboardPage } from '@/pages/WhiteboardPage';
import { MealsPage } from '@/pages/MealsPage';
import { HistoryPage } from '@/pages/HistoryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { BottomNav } from '@/components/BottomNav';
import { AlarmModal } from '@/components/AlarmModal';
import type { Page, ActiveAlarm } from '@/types';
import { getAllArrivalSchedules } from '@/db';
import { getHKTime } from '@/utils/date';
import './App.css';

// App content component (inside providers)
function AppContent() {
  const { t } = useTranslation();
  const { currentUser, isLoading } = useAuth();
  const { isDark } = useTheme();
  const [currentPage, setCurrentPage] = useState<Page>('tasks');
  const [activeAlarm, setActiveAlarm] = useState<ActiveAlarm | null>(null);
  const alarmIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check for arrival alarms
  useEffect(() => {
    if (!currentUser) return;

    const checkAlarms = async () => {
      const now = getHKTime();
      const schedules = await getAllArrivalSchedules();
      
      for (const schedule of schedules) {
        if (!schedule.enabled) continue;

        let shouldTrigger = false;
        let scheduledTime: Date | null = null;

        if (schedule.type === 'oneOff' && schedule.arrivalTime) {
          const arrivalTime = new Date(schedule.arrivalTime);
          const triggerTime = new Date(arrivalTime.getTime() - schedule.leadTimeMinutes * 60000);
          
          // Check if we should trigger (within 1 minute window)
          const diff = Math.abs(now.getTime() - triggerTime.getTime());
          if (diff < 60000 && now >= triggerTime) {
            shouldTrigger = true;
            scheduledTime = arrivalTime;
          }
        } else if (schedule.type === 'recurring' && schedule.daysOfWeek && schedule.timeOfDay) {
          const currentDay = now.getDay();
          const [hours, minutes] = schedule.timeOfDay.split(':').map(Number);
          
          if (schedule.daysOfWeek.includes(currentDay)) {
            const triggerTime = new Date(now);
            triggerTime.setHours(hours, minutes - schedule.leadTimeMinutes, 0, 0);
            
            const diff = Math.abs(now.getTime() - triggerTime.getTime());
            if (diff < 60000 && now >= triggerTime) {
              shouldTrigger = true;
              scheduledTime = new Date(now);
              scheduledTime.setHours(hours, minutes, 0, 0);
            }
          }
        }

        if (shouldTrigger && scheduledTime) {
          setActiveAlarm({
            scheduleId: schedule.id,
            title: schedule.title,
            message: schedule.message,
            scheduledTime,
          });
          break; // Only show one alarm at a time
        }
      }
    };

    // Check immediately and then every minute
    checkAlarms();
    alarmIntervalRef.current = setInterval(checkAlarms, 60000);

    return () => {
      if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
    };
  }, [currentUser]);

  const handleAlarmAcknowledge = () => {
    setActiveAlarm(null);
  };

  const handleAlarmSnooze = () => {
    setActiveAlarm(null);
    // Snooze for 5 minutes
    setTimeout(() => {
      if (activeAlarm) {
        setActiveAlarm(activeAlarm);
      }
    }, 5 * 60 * 1000);
  };

  const handleAlarmMute = () => {
    setActiveAlarm(null);
  };

  // Render current page
  const renderPage = () => {
    switch (currentPage) {
      case 'tasks':
        return <TasksPage />;
      case 'reminders':
        return <RemindersPage />;
      case 'shopping':
        return <ShoppingPage />;
      case 'whiteboard':
        return <WhiteboardPage />;
      case 'meals':
        return <MealsPage />;
      case 'history':
        return <HistoryPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <TasksPage />;
    }
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  return (
    <div className={`min-h-screen pb-20 ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      {/* Main content */}
      <main className="max-w-lg mx-auto">
        {renderPage()}
      </main>

      {/* Bottom navigation */}
      <BottomNav currentPage={currentPage} onPageChange={setCurrentPage} />

      {/* Alarm modal */}
      {activeAlarm && (
        <AlarmModal
          alarm={activeAlarm}
          onAcknowledge={handleAlarmAcknowledge}
          onSnooze={handleAlarmSnooze}
          onMute={handleAlarmMute}
        />
      )}
    </div>
  );
}

// Root App with providers
function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
