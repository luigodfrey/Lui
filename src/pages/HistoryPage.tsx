import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllCompletionLogs, getAllTasks, deleteCompletionLog, getCompletionLogsByTask, updateTask } from '@/db';
import { formatDate } from '@/utils/date';
import type { CompletionLog, Task } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { enrichTask } from '@/utils/taskHelpers';

export function HistoryPage() {
  const { t } = useTranslation();
  const { isOwner, users } = useAuth();
  const { isDark } = useTheme();
  const [logs, setLogs] = useState<CompletionLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState<string>('all');
  const [helperFilter, setHelperFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<CompletionLog | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [allLogs, allTasks] = await Promise.all([
        getAllCompletionLogs(),
        getAllTasks(),
      ]);
      
      // Sort by date descending
      const sortedLogs = allLogs.sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );
      
      setLogs(sortedLogs);
      setTasks(allTasks);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteLog = async (log: CompletionLog) => {
    if (!confirm(t('history.deleteConfirm'))) return;

    try {
      await deleteCompletionLog(log.id);
      
      // Update task's lastCompletedAt
      const task = tasks.find(t => t.id === log.taskId);
      if (task) {
        const remainingLogs = await getCompletionLogsByTask(task.id);
        const lastCompletion = remainingLogs.length > 0
          ? new Date(remainingLogs.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0].completedAt)
          : undefined;
        
        const updatedTask = { ...task, lastCompletedAt: lastCompletion };
        const enriched = await enrichTask(updatedTask);
        await updateTask(enriched);
      }
      
      await loadData();
      setShowDetailDialog(false);
    } catch (error) {
      console.error('Failed to delete log:', error);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    if (taskFilter !== 'all' && log.taskId !== taskFilter) return false;
    if (helperFilter !== 'all' && log.completedBy !== helperFilter) return false;
    return true;
  });

  const getTaskName = (taskId: string) => {
    return tasks.find(t => t.id === taskId)?.title || 'Unknown Task';
  };

  const getHelperName = (userId: string) => {
    return users.find(u => u.id === userId)?.name || 'Unknown';
  };

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
        <h1 className={`page-title ${isDark ? 'text-white' : ''}`}>{t('history.title')}</h1>
        
        {/* Filters */}
        <div className="mt-4 space-y-2">
          <Select value={taskFilter} onValueChange={setTaskFilter}>
            <SelectTrigger className={isDark ? 'bg-slate-700 border-slate-600' : ''}>
              <SelectValue placeholder={t('history.task')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('history.allTasks')}</SelectItem>
              {tasks.map(task => (
                <SelectItem key={task.id} value={task.id}>{task.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={helperFilter} onValueChange={setHelperFilter}>
            <SelectTrigger className={isDark ? 'bg-slate-700 border-slate-600' : ''}>
              <SelectValue placeholder={t('history.helper')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('history.allHelpers')}</SelectItem>
              {users.filter(u => u.role === 'Helper').map(helper => (
                <SelectItem key={helper.id} value={helper.id}>{helper.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* History List */}
      <div className="p-4 space-y-3">
        {filteredLogs.length === 0 ? (
          <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{t('history.noLogs')}</p>
          </div>
        ) : (
          filteredLogs.map(log => (
            <button
              key={log.id}
              onClick={() => {
                setSelectedLog(log);
                setShowDetailDialog(true);
              }}
              className={`w-full text-left card ${isDark ? 'bg-slate-800 border-slate-700' : ''} hover:shadow-md transition-shadow`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className={`font-semibold ${isDark ? 'text-white' : ''}`}>
                    {getTaskName(log.taskId)}
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {t('tasks.completedBy')}: {log.completedByName || getHelperName(log.completedBy)}
                  </p>
                  <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                    {formatDate(log.completedAt)}
                  </p>
                  {log.note && (
                    <p className={`text-sm mt-2 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {log.note}
                    </p>
                  )}
                </div>
                {log.photos.length > 0 && (
                  <Badge className="bg-blue-100 text-blue-600 ml-2">
                    {log.photos.length} {log.photos.length === 1 ? t('history.photo') : t('history.photos')}
                  </Badge>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className={`max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-800 text-white' : ''}`}>
          <DialogHeader>
            <DialogTitle>{t('history.title')}</DialogTitle>
          </DialogHeader>
          
          {selectedLog && (
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t('history.task')}
                </label>
                <p className={`font-semibold ${isDark ? 'text-white' : ''}`}>
                  {getTaskName(selectedLog.taskId)}
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t('history.helper')}
                </label>
                <p className={isDark ? 'text-white' : ''}>
                  {selectedLog.completedByName || getHelperName(selectedLog.completedBy)}
                </p>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {t('tasks.completedAt')}
                </label>
                <p className={isDark ? 'text-white' : ''}>
                  {formatDate(selectedLog.completedAt)}
                </p>
              </div>

              {selectedLog.note && (
                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {t('tasks.completionNote')}
                  </label>
                  <p className={`whitespace-pre-wrap ${isDark ? 'text-white' : ''}`}>
                    {selectedLog.note}
                  </p>
                </div>
              )}

              {selectedLog.photos.length > 0 && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {t('tasks.completionPhotos')}
                  </label>
                  <div className="photo-grid">
                    {selectedLog.photos.map((photo, idx) => (
                      <div key={idx} className="photo-item">
                        <img src={photo} alt={`Photo ${idx + 1}`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isOwner() && (
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteLog(selectedLog)}
                  className="w-full"
                >
                  {t('common.delete')}
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
