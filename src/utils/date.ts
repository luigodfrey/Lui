import { format, addDays, addMonths, startOfDay, isSameDay, isAfter, differenceInDays } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import type { Task, TaskStatus } from '@/types';

const TIMEZONE = 'Asia/Hong_Kong';

// Format date to dd-MMM-yy HH:mm (e.g., 29-Jan-26 09:05)
export function formatDate(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(d, 'dd-MMM-yy HH:mm');
}

// Format date to dd-MMM-yy
export function formatDateShort(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(d, 'dd-MMM-yy');
}

// Format time to HH:mm
export function formatTime(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return format(d, 'HH:mm');
}

// Get relative time (e.g., "2 days ago", "in 3 days")
export function getRelativeTime(date: Date | string | number): string {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const now = new Date();
  const diffDays = differenceInDays(now, d);
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays === -1) return 'Tomorrow';
  if (diffDays > 1) return `${diffDays} days ago`;
  return `in ${Math.abs(diffDays)} days`;
}

// Get current time in Hong Kong
export function getHKTime(): Date {
  const now = new Date();
  return toZonedTime(now, TIMEZONE);
}

// Convert to HK timezone
export function toHKTime(date: Date): Date {
  return toZonedTime(date, TIMEZONE);
}

// Calculate next due date for a task
export function calculateNextDueDate(task: Task): Date | undefined {
  const baseline = task.lastCompletedAt || task.startDate || task.createdAt;
  if (!baseline) return undefined;

  const baselineDate = startOfDay(new Date(baseline));
  
  if (task.frequency === 'weekly') {
    return addDays(baselineDate, 7);
  } else if (task.frequency === 'monthly') {
    return addMonths(baselineDate, 1);
  }
  
  return undefined;
}

// Calculate task status
export function calculateTaskStatus(task: Task): TaskStatus {
  const nextDue = calculateNextDueDate(task);
  if (!nextDue) return 'OK';

  const now = getHKTime();
  const today = startOfDay(now);
  const nextDueDay = startOfDay(nextDue);

  // Overdue: now > nextDueAt
  if (isAfter(today, nextDueDay)) {
    return 'Overdue';
  }

  // DueToday: nextDueAt falls on today's date
  if (isSameDay(today, nextDueDay)) {
    return 'DueToday';
  }

  // Upcoming: weekly due within next 3 days; monthly due within next 5 days
  const diffDays = differenceInDays(nextDueDay, today);
  if (task.frequency === 'weekly' && diffDays <= 3) {
    return 'Upcoming';
  }
  if (task.frequency === 'monthly' && diffDays <= 5) {
    return 'Upcoming';
  }

  return 'OK';
}

// Get last 3 completions for a task
export async function getLastThreeCompletions(taskId: string, getLogs: (taskId: string) => Promise<{ completedAt: Date }[]>): Promise<Date[]> {
  const logs = await getLogs(taskId);
  return logs
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
    .slice(0, 3)
    .map(log => new Date(log.completedAt));
}

// Calculate undo until time (5 minutes after completion)
export function calculateUndoUntil(completedAt: Date): Date {
  return new Date(new Date(completedAt).getTime() + 5 * 60 * 1000);
}

// Check if can undo (within 5 minutes)
export function canUndo(completedAt: Date): boolean {
  const undoUntil = calculateUndoUntil(completedAt);
  return new Date() < undoUntil;
}

// Get remaining undo time in seconds
export function getUndoRemainingSeconds(completedAt: Date): number {
  const undoUntil = calculateUndoUntil(completedAt);
  const now = new Date();
  const remaining = Math.max(0, undoUntil.getTime() - now.getTime());
  return Math.floor(remaining / 1000);
}

// Format countdown (mm:ss)
export function formatCountdown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Get start of week (Monday)
export function getWeekStart(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return startOfDay(new Date(d.setDate(diff)));
}

// Get day name
export function getDayName(date: Date): string {
  return format(date, 'EEEE');
}

// Check if two dates are the same day
export function isSameDate(date1: Date, date2: Date): boolean {
  return isSameDay(date1, date2);
}

// Add days to date
export function addDaysToDate(date: Date, days: number): Date {
  return addDays(date, days);
}
