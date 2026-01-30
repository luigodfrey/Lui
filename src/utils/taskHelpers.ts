import type { Task, CompletionLog, TaskStatus } from '@/types';
import { calculateNextDueDate, calculateTaskStatus, getHKTime } from './date';
import { getCompletionLogsByTask, createCompletionLog, updateTask, deleteCompletionLog } from '@/db';

// Enrich task with computed fields
export async function enrichTask(task: Task): Promise<Task> {
  const enriched = { ...task };
  enriched.nextDueAt = calculateNextDueDate(task);
  enriched.status = calculateTaskStatus(enriched);
  enriched.lastThreeCompletions = await getLastThreeCompletionDates(task.id);
  return enriched;
}

// Get last 3 completion dates for a task
export async function getLastThreeCompletionDates(taskId: string): Promise<Date[]> {
  const logs = await getCompletionLogsByTask(taskId);
  return logs
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 3)
    .map(log => new Date(log.completedAt));
}

// Mark task as complete
export async function markTaskComplete(
  task: Task,
  completedBy: string,
  completedByName: string,
  note?: string,
  photos: string[] = []
): Promise<{ task: Task; log: CompletionLog }> {
  const now = getHKTime();
  const undoUntil = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

  // Create completion log
  const log: CompletionLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    taskId: task.id,
    completedAt: now,
    completedBy,
    completedByName,
    note,
    photos,
    undoUntil,
    createdAt: now,
  };

  await createCompletionLog(log);

  // Update task
  const updatedTask: Task = {
    ...task,
    lastCompletedAt: now,
  };

  // Recompute derived fields
  const enriched = await enrichTask(updatedTask);
  await updateTask(enriched);

  return { task: enriched, log };
}

// Undo task completion
export async function undoTaskCompletion(task: Task, logId: string): Promise<Task> {
  // Delete the completion log
  await deleteCompletionLog(logId);

  // Get remaining logs for this task
  const remainingLogs = await getCompletionLogsByTask(task.id);
  const lastCompletion = remainingLogs.length > 0
    ? new Date(remainingLogs.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0].completedAt)
    : undefined;

  // Update task
  const updatedTask: Task = {
    ...task,
    lastCompletedAt: lastCompletion,
  };

  // Recompute derived fields
  const enriched = await enrichTask(updatedTask);
  await updateTask(enriched);

  return enriched;
}

// Filter tasks by assignee
export function filterTasksByAssignee(tasks: Task[], userId: string, isOwner: boolean): Task[] {
  if (isOwner) return tasks;
  return tasks.filter(task => 
    task.assignedToAllHelpers || task.assignees.includes(userId)
  );
}

// Filter tasks by frequency
export function filterTasksByFrequency(tasks: Task[], frequency: 'weekly' | 'monthly' | 'all'): Task[] {
  if (frequency === 'all') return tasks;
  return tasks.filter(task => task.frequency === frequency);
}

// Filter tasks by priority
export function filterTasksByPriority(tasks: Task[], priority: 'High' | 'Medium' | 'Low' | 'all'): Task[] {
  if (priority === 'all') return tasks;
  return tasks.filter(task => task.priority === priority);
}

// Sort tasks by status (Overdue first, then DueToday, then Upcoming, then OK)
export function sortTasksByStatus(tasks: Task[]): Task[] {
  const statusOrder: Record<TaskStatus, number> = {
    'Overdue': 0,
    'DueToday': 1,
    'Upcoming': 2,
    'OK': 3,
  };

  return [...tasks].sort((a, b) => {
    const statusA = a.status || 'OK';
    const statusB = b.status || 'OK';
    return statusOrder[statusA] - statusOrder[statusB];
  });
}

// Group tasks by status
export function groupTasksByStatus(tasks: Task[]): Record<TaskStatus, Task[]> {
  return {
    Overdue: tasks.filter(t => t.status === 'Overdue'),
    DueToday: tasks.filter(t => t.status === 'DueToday'),
    Upcoming: tasks.filter(t => t.status === 'Upcoming'),
    OK: tasks.filter(t => t.status === 'OK'),
  };
}

// Get task priority color
export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'High':
      return 'text-red-600 bg-red-100';
    case 'Medium':
      return 'text-amber-600 bg-amber-100';
    case 'Low':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

// Get status color
export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'Overdue':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'DueToday':
      return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'Upcoming':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'OK':
      return 'text-green-600 bg-green-50 border-green-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

// Get status label
export function getStatusLabel(status: TaskStatus): string {
  switch (status) {
    case 'Overdue':
      return 'Overdue';
    case 'DueToday':
      return 'Due Today';
    case 'Upcoming':
      return 'Upcoming';
    case 'OK':
      return 'On Track';
    default:
      return 'Unknown';
  }
}
