import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllTasks, getCompletionLogsByTask, createCompletionLog, updateTask, deleteCompletionLog } from '@/db';
import { enrichTask, sortTasksByStatus, getPriorityColor, getStatusColor } from '@/utils/taskHelpers';
import { formatDate, getRelativeTime, formatCountdown, getHKTime } from '@/utils/date';
import type { Task, CompletionLog, TaskFrequency, TaskPriority } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function TasksPage() {
  const { t } = useTranslation();
  const { currentUser, isOwner, users } = useAuth();
  const { isDark } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [frequencyFilter, setFrequencyFilter] = useState<'all' | TaskFrequency>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | TaskPriority>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [completionPhotos, setCompletionPhotos] = useState<string[]>([]);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showUndoDialog, setShowUndoDialog] = useState(false);
  const [undoCountdown, setUndoCountdown] = useState(0);
  const [recentLog, setRecentLog] = useState<CompletionLog | null>(null);
  const [saving, setSaving] = useState(false);

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!currentUser) return;
    
    try {
      const allTasks = await getAllTasks();
      const enrichedTasks = await Promise.all(allTasks.map(enrichTask));
      
      // Filter by assignee
      let filtered = isOwner() 
        ? enrichedTasks 
        : enrichedTasks.filter(t => t.assignedToAllHelpers || t.assignees.includes(currentUser.id));
      
      // Apply frequency filter
      if (frequencyFilter !== 'all') {
        filtered = filtered.filter(t => t.frequency === frequencyFilter);
      }
      
      // Apply priority filter
      if (priorityFilter !== 'all') {
        filtered = filtered.filter(t => t.priority === priorityFilter);
      }
      
      // Apply assignee filter (for owners)
      if (isOwner() && assigneeFilter !== 'all') {
        filtered = filtered.filter(t => 
          t.assignedToAllHelpers || t.assignees.includes(assigneeFilter)
        );
      }
      
      setTasks(sortTasksByStatus(filtered));
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isOwner, frequencyFilter, priorityFilter, assigneeFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Undo countdown timer
  useEffect(() => {
    if (undoCountdown > 0) {
      const timer = setInterval(() => {
        setUndoCountdown(prev => {
          if (prev <= 1) {
            setShowUndoDialog(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [undoCountdown]);

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
      
      const log: CompletionLog = {
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
      
      // Update task
      const updatedTask: Task = {
        ...selectedTask,
        lastCompletedAt: now,
      };
      const enriched = await enrichTask(updatedTask);
      await updateTask(enriched);
      
      setRecentLog(log);
      setShowCompleteDialog(false);
      setShowUndoDialog(true);
      setUndoCountdown(300); // 5 minutes
      
      await loadTasks();
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async () => {
    if (!recentLog || !selectedTask) return;
    
    try {
      await deleteCompletionLog(recentLog.id);
      
      // Get remaining logs
      const remainingLogs = await getCompletionLogsByTask(selectedTask.id);
      const lastCompletion = remainingLogs.length > 0
        ? new Date(remainingLogs.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0].completedAt)
        : undefined;
      
      const updatedTask: Task = {
        ...selectedTask,
        lastCompletedAt: lastCompletion,
      };
      const enriched = await enrichTask(updatedTask);
      await updateTask(enriched);
      
      setShowUndoDialog(false);
      setRecentLog(null);
      await loadTasks();
    } catch (error) {
      console.error('Failed to undo completion:', error);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newPhotos: string[] = [];
    Array.from(files).slice(0, 3 - completionPhotos.length).forEach(file => {
      if (file.size > 5 * 1024 * 1024) return; // Max 5MB
      const reader = new FileReader();
      reader.onloadend = () => {
        newPhotos.push(reader.result as string);
        if (newPhotos.length === Math.min(files.length, 3 - completionPhotos.length)) {
          setCompletionPhotos(prev => [...prev, ...newPhotos].slice(0, 3));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const helpers = users.filter(u => u.role === 'Helper');

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
        <h1 className={`page-title ${isDark ? 'text-white' : ''}`}>{t('tasks.title')}</h1>
        
        {/* Filters */}
        <div className="mt-4 space-y-3">
          {/* Frequency tabs */}
          <Tabs value={frequencyFilter} onValueChange={(v) => setFrequencyFilter(v as typeof frequencyFilter)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">{t('tasks.all')}</TabsTrigger>
              <TabsTrigger value="weekly">{t('tasks.weekly')}</TabsTrigger>
              <TabsTrigger value="monthly">{t('tasks.monthly')}</TabsTrigger>
            </TabsList>
          </Tabs>
          
          {/* Priority and Assignee filters */}
          <div className="flex gap-2">
            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as typeof priorityFilter)}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={t('tasks.priority')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('tasks.all')}</SelectItem>
                <SelectItem value="High">{t('tasks.high')}</SelectItem>
                <SelectItem value="Medium">{t('tasks.medium')}</SelectItem>
                <SelectItem value="Low">{t('tasks.low')}</SelectItem>
              </SelectContent>
            </Select>
            
            {isOwner() && (
              <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder={t('tasks.assignTo')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('tasks.allHelpers')}</SelectItem>
                  {helpers.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="p-4 space-y-3">
        {tasks.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{t('tasks.noTasks')}</p>
          </div>
        ) : (
          tasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onMarkComplete={() => handleMarkComplete(task)}
              isDark={isDark}
            />
          ))
        )}
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
              <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('tasks.maxPhotos')}
              </p>
              
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

      {/* Undo Dialog */}
      <Dialog open={showUndoDialog} onOpenChange={setShowUndoDialog}>
        <DialogContent className={isDark ? 'bg-slate-800 text-white' : ''}>
          <DialogHeader>
            <DialogTitle>{t('tasks.undo')}</DialogTitle>
          </DialogHeader>
          
          <div className="text-center py-4">
            <div className="text-4xl mb-4">✅</div>
            <p className={`mb-2 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {t('tasks.undoIn', { time: formatCountdown(undoCountdown) })}
            </p>
            <div className="countdown text-2xl">
              {formatCountdown(undoCountdown)}
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUndoDialog(false)}
              className="flex-1"
            >
              {t('common.close')}
            </Button>
            <Button
              onClick={handleUndo}
              variant="destructive"
              className="flex-1"
            >
              {t('tasks.undo')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Task Card Component
interface TaskCardProps {
  task: Task;
  onMarkComplete: () => void;
  isDark: boolean;
}

function TaskCard({ task, onMarkComplete, isDark }: TaskCardProps) {
  const { t } = useTranslation();
  const statusColor = getStatusColor(task.status || 'OK');
  const priorityColor = getPriorityColor(task.priority);

  return (
    <div className={`task-card ${statusColor} ${isDark ? 'bg-slate-800' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className={`font-semibold text-lg ${isDark ? 'text-white' : ''}`}>
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

      <div className={`flex items-center gap-2 text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
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

      {task.lastThreeCompletions && task.lastThreeCompletions.length > 0 && (
        <div className={`text-xs mb-3 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
          <span>{t('tasks.last3Completions')}: </span>
          <span>{task.lastThreeCompletions.map(d => formatDate(d)).join(' • ')}</span>
        </div>
      )}

      <Button
        onClick={onMarkComplete}
        className="w-full bg-blue-600 hover:bg-blue-700"
      >
        {t('tasks.markComplete')}
      </Button>
    </div>
  );
}
