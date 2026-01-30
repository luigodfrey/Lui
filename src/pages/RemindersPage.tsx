import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllTasks, createCompletionLog, updateTask, getCompletionLogsByTask } from '@/db';
import { enrichTask, getStatusColor, getPriorityColor } from '@/utils/taskHelpers';
import { formatDate, getRelativeTime, getHKTime } from '@/utils/date';
import type { Task, TaskStatus } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function RemindersPage() {
  const { t } = useTranslation();
  const { currentUser, isOwner } = useAuth();
  const { isDark } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionNote, setCompletionNote] = useState('');
  const [completionPhotos, setCompletionPhotos] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const loadTasks = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const allTasks = await getAllTasks();
      const enrichedTasks = await Promise.all(allTasks.map(enrichTask));
      
      // Filter by assignee and active status
      let filtered = isOwner() 
        ? enrichedTasks 
        : enrichedTasks.filter(t => t.assignedToAllHelpers || t.assignees.includes(currentUser.id));
      
      // Only show active tasks
      filtered = filtered.filter(t => t.isActive);
      
      // Sort by status priority
      const statusOrder: Record<TaskStatus, number> = {
        'Overdue': 0,
        'DueToday': 1,
        'Upcoming': 2,
        'OK': 3,
      };
      
      filtered.sort((a, b) => {
        const statusDiff = statusOrder[a.status || 'OK'] - statusOrder[b.status || 'OK'];
        if (statusDiff !== 0) return statusDiff;
        // Within same status, sort by priority
        const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
      
      setTasks(filtered);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isOwner]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleMarkComplete = (task: Task) => {
    setSelectedTask(task);
    setCompletionNote('');
    setCompletionPhotos([]);
    setShowCompleteDialog(true);
  };

  const handleConfirmComplete = async () => {
    if (!selectedTask || !currentUser) return;
    
    setSaving(true);
    try {
      const now = getHKTime();
      const undoUntil = new Date(now.getTime() + 5 * 60 * 1000);
      
      const log = {
        id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        taskId: selectedTask.id,
        completedAt: now,
        completedBy: currentUser.id,
        completedByName: currentUser.name,
        note: completionNote,
        photos: completionPhotos,
        undoUntil,
        createdAt: now,
      };
      
      await createCompletionLog(log);
      
      const updatedTask: Task = {
        ...selectedTask,
        lastCompletedAt: now,
      };
      
      // Re-enrich task
      const logs = await getCompletionLogsByTask(selectedTask.id);
      const lastThree = logs
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
        .slice(0, 3)
        .map(l => new Date(l.completedAt));
      
      const enriched = await enrichTask(updatedTask);
      enriched.lastThreeCompletions = lastThree;
      await updateTask(enriched);
      
      setShowCompleteDialog(false);
      await loadTasks();
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).slice(0, 3 - completionPhotos.length).forEach(file => {
      if (file.size > 5 * 1024 * 1024) return;
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompletionPhotos(prev => [...prev, reader.result as string].slice(0, 3));
      };
      reader.readAsDataURL(file);
    });
  };

  // Group tasks by status
  const overdueTasks = tasks.filter(t => t.status === 'Overdue');
  const dueTodayTasks = tasks.filter(t => t.status === 'DueToday');
  const upcomingTasks = tasks.filter(t => t.status === 'Upcoming');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className={`page-header ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
        <h1 className={`page-title ${isDark ? 'text-white' : ''}`}>{t('reminders.title')}</h1>
      </div>

      {/* Reminders List */}
      <div className="p-4 space-y-6">
        {/* Overdue Section */}
        <section>
          <h2 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            {t('reminders.overdue')}
            <Badge variant="secondary" className="bg-red-100 text-red-600">
              {overdueTasks.length}
            </Badge>
          </h2>
          {overdueTasks.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('reminders.noOverdue')}
            </p>
          ) : (
            <div className="space-y-3">
              {overdueTasks.map(task => (
                <ReminderCard
                  key={task.id}
                  task={task}
                  onMarkComplete={() => handleMarkComplete(task)}
                  isDark={isDark}
                />
              ))}
            </div>
          )}
        </section>

        {/* Due Today Section */}
        <section>
          <h2 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            {t('reminders.dueToday')}
            <Badge variant="secondary" className="bg-orange-100 text-orange-600">
              {dueTodayTasks.length}
            </Badge>
          </h2>
          {dueTodayTasks.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('reminders.noDueToday')}
            </p>
          ) : (
            <div className="space-y-3">
              {dueTodayTasks.map(task => (
                <ReminderCard
                  key={task.id}
                  task={task}
                  onMarkComplete={() => handleMarkComplete(task)}
                  isDark={isDark}
                />
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Section */}
        <section>
          <h2 className={`text-lg font-semibold mb-3 flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            {t('reminders.upcoming')}
            <Badge variant="secondary" className="bg-blue-100 text-blue-600">
              {upcomingTasks.length}
            </Badge>
          </h2>
          {upcomingTasks.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {t('reminders.noUpcoming')}
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingTasks.map(task => (
                <ReminderCard
                  key={task.id}
                  task={task}
                  onMarkComplete={() => handleMarkComplete(task)}
                  isDark={isDark}
                />
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className={isDark ? 'bg-slate-800 text-white' : ''}>
          <DialogHeader>
            <DialogTitle>{t('tasks.markComplete')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className={isDark ? 'text-slate-300' : 'text-slate-600'}>
              {selectedTask?.title}
            </p>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t('tasks.completionNote')}</label>
              <textarea
                value={completionNote}
                onChange={(e) => setCompletionNote(e.target.value)}
                placeholder={t('common.optional')}
                className={`w-full px-3 py-2 rounded-lg border ${
                  isDark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'
                }`}
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t('tasks.completionPhotos')}</label>
              <div className="photo-grid mb-3">
                {completionPhotos.map((photo, idx) => (
                  <div key={idx} className="photo-item relative">
                    <img src={photo} alt={`Photo ${idx + 1}`} />
                    <button
                      onClick={() => setCompletionPhotos(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {completionPhotos.length < 3 && (
                  <label className="photo-item flex items-center justify-center border-2 border-dashed border-slate-300 cursor-pointer">
                    <span className="text-2xl text-slate-400">+</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      multiple
                    />
                  </label>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowCompleteDialog(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleConfirmComplete}
                disabled={saving}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {saving ? t('common.loading') : t('tasks.markComplete')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Reminder Card Component
interface ReminderCardProps {
  task: Task;
  onMarkComplete: () => void;
  isDark: boolean;
}

function ReminderCard({ task, onMarkComplete, isDark }: ReminderCardProps) {
  const { t } = useTranslation();
  const priorityColor = getPriorityColor(task.priority);

  return (
    <div className={`task-card ${getStatusColor(task.status || 'OK')} ${isDark ? 'bg-slate-800' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className={`font-semibold ${isDark ? 'text-white' : ''}`}>
            {task.title}
          </h3>
          {task.description && (
            <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {task.description}
            </p>
          )}
        </div>
        <Badge className={`${priorityColor} ml-2 shrink-0`}>
          {t(`tasks.${task.priority.toLowerCase()}`)}
        </Badge>
      </div>

      <div className={`flex items-center gap-2 text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        <Badge variant="outline" className="text-xs">
          {t(`tasks.${task.frequency}`)}
        </Badge>
        <span>•</span>
        <span>{t('tasks.nextDue')}: {task.nextDueAt ? formatDate(task.nextDueAt) : '-'}</span>
      </div>

      {task.lastCompletedAt && (
        <div className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          <span>{t('tasks.lastDone')}: </span>
          <span className="font-medium" title={formatDate(task.lastCompletedAt)}>
            {getRelativeTime(task.lastCompletedAt)}
          </span>
        </div>
      )}

      <Button
        onClick={onMarkComplete}
        size="sm"
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {t('tasks.markComplete')}
      </Button>
    </div>
  );
}
