import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  User,
  UserPreferences,
  Task,
  CompletionLog,
  WhiteboardPost,
  WhiteboardComment,
  ShoppingItemCatalog,
  ShoppingListItem,
  ArrivalSchedule,
  MealItem,
  WeeklyMealPlan,
  DailyMealOverride,
} from '@/types';

interface HomeHelperDB extends DBSchema {
  users: {
    key: string;
    value: User;
    indexes: { 'by-email': string };
  };
  userPreferences: {
    key: string;
    value: UserPreferences;
  };
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-assignee': string };
  };
  completionLogs: {
    key: string;
    value: CompletionLog;
    indexes: { 'by-task': string; 'by-date': Date };
  };
  whiteboardPosts: {
    key: string;
    value: WhiteboardPost;
    indexes: { 'by-pinned': number };
  };
  whiteboardComments: {
    key: string;
    value: WhiteboardComment;
    indexes: { 'by-post': string };
  };
  shoppingCatalog: {
    key: string;
    value: ShoppingItemCatalog;
    indexes: { 'by-category': string };
  };
  shoppingList: {
    key: string;
    value: ShoppingListItem;
    indexes: { 'by-status': string; 'by-assignee': string };
  };
  arrivalSchedules: {
    key: string;
    value: ArrivalSchedule;
    indexes: { 'by-enabled': number };
  };
  mealItems: {
    key: string;
    value: MealItem;
    indexes: { 'by-meal-type': string };
  };
  weeklyMealPlans: {
    key: string;
    value: WeeklyMealPlan;
    indexes: { 'by-week-start': Date };
  };
  dailyMealOverrides: {
    key: string;
    value: DailyMealOverride;
    indexes: { 'by-date': Date };
  };
}

const DB_NAME = 'HomeHelperHub';
const DB_VERSION = 1;

let db: IDBPDatabase<HomeHelperDB> | null = null;

export async function initDB(): Promise<IDBPDatabase<HomeHelperDB>> {
  if (db) return db;

  db = await openDB<HomeHelperDB>(DB_NAME, DB_VERSION, {
    upgrade(database) {
      // Users store
      if (!database.objectStoreNames.contains('users')) {
        const userStore = database.createObjectStore('users', { keyPath: 'id' });
        userStore.createIndex('by-email', 'email', { unique: true });
      }

      // User Preferences store
      if (!database.objectStoreNames.contains('userPreferences')) {
        database.createObjectStore('userPreferences', { keyPath: 'userId' });
      }

      // Tasks store
      if (!database.objectStoreNames.contains('tasks')) {
        const taskStore = database.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-assignee', 'assignees', { multiEntry: true });
      }

      // Completion Logs store
      if (!database.objectStoreNames.contains('completionLogs')) {
        const logStore = database.createObjectStore('completionLogs', { keyPath: 'id' });
        logStore.createIndex('by-task', 'taskId');
        logStore.createIndex('by-date', 'completedAt');
      }

      // Whiteboard Posts store
      if (!database.objectStoreNames.contains('whiteboardPosts')) {
        const postStore = database.createObjectStore('whiteboardPosts', { keyPath: 'id' });
        postStore.createIndex('by-pinned', 'pinned');
      }

      // Whiteboard Comments store
      if (!database.objectStoreNames.contains('whiteboardComments')) {
        const commentStore = database.createObjectStore('whiteboardComments', { keyPath: 'id' });
        commentStore.createIndex('by-post', 'postId');
      }

      // Shopping Catalog store
      if (!database.objectStoreNames.contains('shoppingCatalog')) {
        const catalogStore = database.createObjectStore('shoppingCatalog', { keyPath: 'id' });
        catalogStore.createIndex('by-category', 'category');
      }

      // Shopping List store
      if (!database.objectStoreNames.contains('shoppingList')) {
        const listStore = database.createObjectStore('shoppingList', { keyPath: 'id' });
        listStore.createIndex('by-status', 'status');
        listStore.createIndex('by-assignee', 'assignedTo');
      }

      // Arrival Schedules store
      if (!database.objectStoreNames.contains('arrivalSchedules')) {
        const scheduleStore = database.createObjectStore('arrivalSchedules', { keyPath: 'id' });
        scheduleStore.createIndex('by-enabled', 'enabled');
      }

      // Meal Items store
      if (!database.objectStoreNames.contains('mealItems')) {
        const mealStore = database.createObjectStore('mealItems', { keyPath: 'id' });
        mealStore.createIndex('by-meal-type', 'mealType');
      }

      // Weekly Meal Plans store
      if (!database.objectStoreNames.contains('weeklyMealPlans')) {
        const planStore = database.createObjectStore('weeklyMealPlans', { keyPath: 'id' });
        planStore.createIndex('by-week-start', 'weekStartDate');
      }

      // Daily Meal Overrides store
      if (!database.objectStoreNames.contains('dailyMealOverrides')) {
        const overrideStore = database.createObjectStore('dailyMealOverrides', { keyPath: 'id' });
        overrideStore.createIndex('by-date', 'date');
      }
    },
  });

  return db;
}

export async function getDB(): Promise<IDBPDatabase<HomeHelperDB>> {
  if (!db) {
    return initDB();
  }
  return db;
}

// User operations
export async function createUser(user: User): Promise<void> {
  const database = await getDB();
  await database.put('users', user);
}

export async function getUserById(id: string): Promise<User | undefined> {
  const database = await getDB();
  return database.get('users', id);
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  const database = await getDB();
  return database.getFromIndex('users', 'by-email', email);
}

export async function getAllUsers(): Promise<User[]> {
  const database = await getDB();
  return database.getAll('users');
}

export async function updateUser(user: User): Promise<void> {
  const database = await getDB();
  user.updatedAt = new Date();
  await database.put('users', user);
}

export async function deleteUser(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('users', id);
}

// User Preferences operations
export async function getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
  const database = await getDB();
  return database.get('userPreferences', userId);
}

export async function saveUserPreferences(prefs: UserPreferences): Promise<void> {
  const database = await getDB();
  await database.put('userPreferences', prefs);
}

// Task operations
export async function createTask(task: Task): Promise<void> {
  const database = await getDB();
  await database.put('tasks', task);
}

export async function getTaskById(id: string): Promise<Task | undefined> {
  const database = await getDB();
  return database.get('tasks', id);
}

export async function getAllTasks(): Promise<Task[]> {
  const database = await getDB();
  return database.getAll('tasks');
}

export async function updateTask(task: Task): Promise<void> {
  const database = await getDB();
  task.updatedAt = new Date();
  await database.put('tasks', task);
}

export async function deleteTask(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('tasks', id);
  // Also delete related completion logs
  const logs = await getCompletionLogsByTask(id);
  for (const log of logs) {
    await deleteCompletionLog(log.id);
  }
}

// Completion Log operations
export async function createCompletionLog(log: CompletionLog): Promise<void> {
  const database = await getDB();
  await database.put('completionLogs', log);
}

export async function getCompletionLogById(id: string): Promise<CompletionLog | undefined> {
  const database = await getDB();
  return database.get('completionLogs', id);
}

export async function getCompletionLogsByTask(taskId: string): Promise<CompletionLog[]> {
  const database = await getDB();
  return database.getAllFromIndex('completionLogs', 'by-task', taskId);
}

export async function getAllCompletionLogs(): Promise<CompletionLog[]> {
  const database = await getDB();
  return database.getAll('completionLogs');
}

export async function deleteCompletionLog(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('completionLogs', id);
}

// Whiteboard operations
export async function createWhiteboardPost(post: WhiteboardPost): Promise<void> {
  const database = await getDB();
  await database.put('whiteboardPosts', post);
}

export async function getAllWhiteboardPosts(): Promise<WhiteboardPost[]> {
  const database = await getDB();
  return database.getAll('whiteboardPosts');
}

export async function updateWhiteboardPost(post: WhiteboardPost): Promise<void> {
  const database = await getDB();
  post.updatedAt = new Date();
  await database.put('whiteboardPosts', post);
}

export async function deleteWhiteboardPost(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('whiteboardPosts', id);
  // Delete related comments
  const comments = await getCommentsByPost(id);
  for (const comment of comments) {
    await deleteWhiteboardComment(comment.id);
  }
}

// Whiteboard Comment operations
export async function createWhiteboardComment(comment: WhiteboardComment): Promise<void> {
  const database = await getDB();
  await database.put('whiteboardComments', comment);
}

export async function getCommentsByPost(postId: string): Promise<WhiteboardComment[]> {
  const database = await getDB();
  return database.getAllFromIndex('whiteboardComments', 'by-post', postId);
}

export async function deleteWhiteboardComment(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('whiteboardComments', id);
}

// Shopping Catalog operations
export async function createShoppingCatalogItem(item: ShoppingItemCatalog): Promise<void> {
  const database = await getDB();
  await database.put('shoppingCatalog', item);
}

export async function getAllShoppingCatalogItems(): Promise<ShoppingItemCatalog[]> {
  const database = await getDB();
  return database.getAll('shoppingCatalog');
}

export async function deleteShoppingCatalogItem(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('shoppingCatalog', id);
}

// Shopping List operations
export async function createShoppingListItem(item: ShoppingListItem): Promise<void> {
  const database = await getDB();
  await database.put('shoppingList', item);
}

export async function getAllShoppingListItems(): Promise<ShoppingListItem[]> {
  const database = await getDB();
  return database.getAll('shoppingList');
}

export async function updateShoppingListItem(item: ShoppingListItem): Promise<void> {
  const database = await getDB();
  item.updatedAt = new Date();
  await database.put('shoppingList', item);
}

export async function deleteShoppingListItem(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('shoppingList', id);
}

// Arrival Schedule operations
export async function createArrivalSchedule(schedule: ArrivalSchedule): Promise<void> {
  const database = await getDB();
  await database.put('arrivalSchedules', schedule);
}

export async function getAllArrivalSchedules(): Promise<ArrivalSchedule[]> {
  const database = await getDB();
  return database.getAll('arrivalSchedules');
}

export async function updateArrivalSchedule(schedule: ArrivalSchedule): Promise<void> {
  const database = await getDB();
  schedule.updatedAt = new Date();
  await database.put('arrivalSchedules', schedule);
}

export async function deleteArrivalSchedule(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('arrivalSchedules', id);
}

// Meal Item operations
export async function createMealItem(item: MealItem): Promise<void> {
  const database = await getDB();
  await database.put('mealItems', item);
}

export async function getAllMealItems(): Promise<MealItem[]> {
  const database = await getDB();
  return database.getAll('mealItems');
}

export async function getMealItemsByType(mealType: string): Promise<MealItem[]> {
  const database = await getDB();
  return database.getAllFromIndex('mealItems', 'by-meal-type', mealType);
}

export async function deleteMealItem(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('mealItems', id);
}

// Weekly Meal Plan operations
export async function createWeeklyMealPlan(plan: WeeklyMealPlan): Promise<void> {
  const database = await getDB();
  await database.put('weeklyMealPlans', plan);
}

export async function getWeeklyMealPlanByWeekStart(weekStartDate: Date): Promise<WeeklyMealPlan | undefined> {
  const database = await getDB();
  const plans = await database.getAllFromIndex('weeklyMealPlans', 'by-week-start', weekStartDate);
  return plans[0];
}

export async function getAllWeeklyMealPlans(): Promise<WeeklyMealPlan[]> {
  const database = await getDB();
  return database.getAll('weeklyMealPlans');
}

export async function updateWeeklyMealPlan(plan: WeeklyMealPlan): Promise<void> {
  const database = await getDB();
  plan.updatedAt = new Date();
  await database.put('weeklyMealPlans', plan);
}

// Daily Meal Override operations
export async function createDailyMealOverride(override: DailyMealOverride): Promise<void> {
  const database = await getDB();
  await database.put('dailyMealOverrides', override);
}

export async function getDailyMealOverridesByDate(date: Date): Promise<DailyMealOverride[]> {
  const database = await getDB();
  // Get all overrides and filter by date
  const allOverrides = await database.getAll('dailyMealOverrides');
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);
  return allOverrides.filter(o => {
    const oDate = new Date(o.date);
    oDate.setHours(0, 0, 0, 0);
    return oDate.getTime() === targetDate.getTime();
  });
}

export async function deleteDailyMealOverride(id: string): Promise<void> {
  const database = await getDB();
  await database.delete('dailyMealOverrides', id);
}

export async function clearDailyMealOverrideByDateAndType(date: Date, mealType: string): Promise<void> {
  const database = await getDB();
  const overrides = await getDailyMealOverridesByDate(date);
  for (const override of overrides) {
    if (override.mealType === mealType) {
      await database.delete('dailyMealOverrides', override.id);
    }
  }
}
