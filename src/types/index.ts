// User Types
export type UserRole = 'Owner' | 'Helper';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  userId: string;
  themePreset: ThemePreset;
  mode: 'light' | 'dark' | 'system';
  accentColor: string;
  fontSize: 'normal' | 'large';
  alarmSound: string;
  alarmVolume: number;
  alarmMuted: boolean;
}

export type ThemePreset = 'classic-light' | 'classic-dark' | 'ocean-blue' | 'mint-green' | 'warm-sand' | 'lavender';

// Task Types
export type TaskFrequency = 'weekly' | 'monthly';
export type TaskPriority = 'High' | 'Medium' | 'Low';
export type TaskStatus = 'Overdue' | 'DueToday' | 'Upcoming' | 'OK';

export interface Task {
  id: string;
  title: string;
  description?: string;
  frequency: TaskFrequency;
  priority: TaskPriority;
  isActive: boolean;
  assignedToAllHelpers: boolean;
  assignees: string[]; // helper userIds
  startDate?: Date;
  lastCompletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  // Derived fields (computed)
  nextDueAt?: Date;
  status?: TaskStatus;
  lastThreeCompletions?: Date[];
}

export interface CompletionLog {
  id: string;
  taskId: string;
  completedAt: Date;
  completedBy: string; // userId
  completedByName?: string;
  note?: string;
  photos: string[];
  undoUntil: Date;
  createdAt: Date;
}

// Whiteboard Types
export interface WhiteboardPost {
  id: string;
  content: string;
  pinned: boolean;
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface WhiteboardComment {
  id: string;
  postId: string;
  comment: string;
  createdBy: string;
  createdByName?: string;
  createdAt: Date;
}

// Shopping Types
export interface ShoppingItemCatalog {
  id: string;
  name: string;
  category: string;
  defaultUnit: string;
  isStandard: boolean;
}

export type ShoppingItemStatus = 'ToBuy' | 'Bought' | 'OutOfStock' | 'Deferred';

export interface ShoppingListItem {
  id: string;
  catalogItemId?: string;
  customName?: string;
  category: string;
  quantity: number;
  unit: string;
  priority: TaskPriority;
  status: ShoppingItemStatus;
  assignedTo?: string;
  dueDate?: Date;
  notes?: string;
  photo?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  boughtAt?: Date;
  boughtBy?: string;
}

// Arrival Alarm Types
export type ArrivalType = 'oneOff' | 'recurring';

export interface ArrivalSchedule {
  id: string;
  title: string;
  enabled: boolean;
  type: ArrivalType;
  arrivalTime?: Date; // for oneOff
  daysOfWeek?: number[]; // 0-6 for recurring
  timeOfDay?: string; // HH:mm for recurring
  startDate?: Date;
  endDate?: Date;
  leadTimeMinutes: number;
  notifyAllHelpers: boolean;
  notifyHelpers: string[]; // helper userIds
  message?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

// Meal Types
export type MealType = 'breakfast' | 'lunch' | 'dinner';

export interface MealItem {
  id: string;
  name: string;
  mealType: MealType;
  photoUrl: string;
  tags: string[];
  isStandard: boolean;
}

export interface DayMealPlan {
  breakfastSelectedItems: string[]; // MealItem ids or custom strings
  lunchSelectedItems: string[];
  dinnerSelectedItems: string[];
  breakfastNote?: string;
  lunchNote?: string;
  dinnerNote?: string;
}

export interface WeeklyMealPlan {
  id: string;
  weekStartDate: Date; // Monday
  monday: DayMealPlan;
  tuesday: DayMealPlan;
  wednesday: DayMealPlan;
  thursday: DayMealPlan;
  friday: DayMealPlan;
  saturday: DayMealPlan;
  sunday: DayMealPlan;
  createdBy: string;
  updatedAt: Date;
}

export interface DailyMealOverride {
  id: string;
  date: Date;
  mealType: MealType;
  selectedItems: string[]; // MealItem ids or custom strings
  note?: string;
  createdBy: string;
  updatedAt: Date;
}

// Navigation
export type Page = 'tasks' | 'reminders' | 'shopping' | 'whiteboard' | 'meals' | 'history' | 'settings';

// Alarm State
export interface ActiveAlarm {
  scheduleId: string;
  title: string;
  message?: string;
  scheduledTime: Date;
}
