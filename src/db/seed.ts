import type {
  User,
  UserPreferences,
  Task,
  ShoppingItemCatalog,
  MealItem,
} from '@/types';
import {
  createUser,
  saveUserPreferences,
  createTask,
  createShoppingCatalogItem,
  createMealItem,
  getUserByEmail,
  getAllTasks,
  getAllShoppingCatalogItems,
  getAllMealItems,
} from './index';

// Default password hash for demo (password: "password")
const DEFAULT_PASSWORD_HASH = 'demo-hash-password';

export async function seedDatabase(): Promise<void> {
  await seedUsers();
  await seedTasks();
  await seedShoppingCatalog();
  await seedMealItems();
}

async function seedUsers(): Promise<void> {
  // Check if already seeded
  const existingMadam = await getUserByEmail('madam@home.com');
  if (existingMadam) return;

  // Create default owners
  const madam: User = {
    id: 'owner-madam',
    email: 'madam@home.com',
    name: 'Madam',
    role: 'Owner',
    passwordHash: DEFAULT_PASSWORD_HASH,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sir: User = {
    id: 'owner-sir',
    email: 'sir@home.com',
    name: 'Sir',
    role: 'Owner',
    passwordHash: DEFAULT_PASSWORD_HASH,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Create default helper
  const helper: User = {
    id: 'helper-1',
    email: 'helper@home.com',
    name: 'Helper',
    role: 'Helper',
    passwordHash: DEFAULT_PASSWORD_HASH,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  await createUser(madam);
  await createUser(sir);
  await createUser(helper);

  // Create default preferences
  const madamPrefs: UserPreferences = {
    userId: madam.id,
    themePreset: 'classic-light',
    mode: 'light',
    accentColor: '#3b82f6',
    fontSize: 'normal',
    alarmSound: 'default',
    alarmVolume: 80,
    alarmMuted: false,
  };

  const sirPrefs: UserPreferences = {
    userId: sir.id,
    themePreset: 'classic-light',
    mode: 'light',
    accentColor: '#3b82f6',
    fontSize: 'normal',
    alarmSound: 'default',
    alarmVolume: 80,
    alarmMuted: false,
  };

  const helperPrefs: UserPreferences = {
    userId: helper.id,
    themePreset: 'classic-light',
    mode: 'light',
    accentColor: '#3b82f6',
    fontSize: 'normal',
    alarmSound: 'default',
    alarmVolume: 80,
    alarmMuted: false,
  };

  await saveUserPreferences(madamPrefs);
  await saveUserPreferences(sirPrefs);
  await saveUserPreferences(helperPrefs);
}

async function seedTasks(): Promise<void> {
  const existingTasks = await getAllTasks();
  if (existingTasks.length > 0) return;

  const now = new Date();

  // Weekly High Priority Tasks
  const weeklyHighTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { title: "Clean daughter's bedroom", description: "Tidy up, dust, and vacuum", frequency: 'weekly', priority: 'High', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Disinfect toys', description: 'Clean and sanitize all toys', frequency: 'weekly', priority: 'High', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Wash and change bedding', description: 'Change sheets on all beds', frequency: 'weekly', priority: 'High', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Clean stroller & child chairs', description: 'Wipe down and sanitize', frequency: 'weekly', priority: 'High', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Prepare swimming suit bag', description: 'Pack towels, swimsuits, and accessories', frequency: 'weekly', priority: 'High', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
  ];

  // Weekly Medium Priority Tasks
  const weeklyMediumTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { title: 'Deep clean bathrooms', description: 'Scrub toilets, sinks, showers, and floors', frequency: 'weekly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Dust shelves', description: 'Dust all shelves and surfaces', frequency: 'weekly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Clean mirrors', description: 'Wipe all mirrors streak-free', frequency: 'weekly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Vacuum', description: 'Vacuum all carpeted areas', frequency: 'weekly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Clean A/C filters (Dry)', description: 'Remove and dry clean AC filters', frequency: 'weekly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Check delicates', description: 'Inspect delicate items for special care', frequency: 'weekly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Clean refrigerator', description: 'Wipe shelves and discard expired items', frequency: 'weekly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Organize pantry shelves', description: 'Tidy and organize pantry items', frequency: 'weekly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
  ];

  // Monthly Medium Priority Tasks
  const monthlyMediumTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { title: 'Deep clean toy storage', description: 'Organize and sanitize toy storage areas', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Sort out clothes no longer fit', description: 'Remove outgrown clothes from closets', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Clean windows (inside)', description: 'Wash interior windows', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Deep clean kitchen', description: 'Clean appliances, cabinets, and backsplash', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Organize storage cabinets', description: 'Tidy and reorganize storage areas', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Clean curtains', description: 'Dust or wash curtains', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Clean high areas', description: 'Dust ceiling fans, light fixtures, and high shelves', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Clean walls', description: 'Spot clean walls and baseboards', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Clean A/C filters (Wet)', description: 'Deep clean AC filters with water', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Thermo ventilator filter', description: 'Clean bathroom ventilator filter', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Replace batteries', description: 'Replace batteries in smoke detectors and remotes', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Clean washing machine filter', description: 'Remove lint and debris from washer filter', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Wash machine drum with cleaning agent', description: 'Run washing machine cleaning cycle', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Clean hair dryer filter', description: 'Remove lint from hair dryer', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Clean clothing dryer filter', description: 'Clean dryer lint trap and vent', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Clean humidifier filter', description: 'Clean or replace humidifier filter', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Deep clean stove & extractor hood', description: 'Degrease and clean kitchen hood and stove', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
    { title: 'Inventory ingredients', description: 'Check pantry and create shopping list', frequency: 'monthly', priority: 'Medium', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
  ];

  // Monthly Low Priority Tasks
  const monthlyLowTasks: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>[] = [
    { title: 'Prepare seasonal storage items', description: 'Pack away out-of-season clothing and items', frequency: 'monthly', priority: 'Low', isActive: true, assignedToAllHelpers: true, assignees: [], startDate: now },
  ];

  // Create all tasks
  const allTaskData = [
    ...weeklyHighTasks,
    ...weeklyMediumTasks,
    ...monthlyMediumTasks,
    ...monthlyLowTasks,
  ];

  for (const taskData of allTaskData) {
    const task: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await createTask(task);
  }
}

async function seedShoppingCatalog(): Promise<void> {
  const existingItems = await getAllShoppingCatalogItems();
  if (existingItems.length > 0) return;

  const catalogItems: Omit<ShoppingItemCatalog, 'id'>[] = [
    // Laundry/Cleaning
    { name: 'Laundry detergent', category: 'Laundry/Cleaning', defaultUnit: 'bottle', isStandard: true },
    { name: 'Bleach', category: 'Laundry/Cleaning', defaultUnit: 'bottle', isStandard: true },
    { name: 'Fabric softener', category: 'Laundry/Cleaning', defaultUnit: 'bottle', isStandard: true },
    { name: 'Stain remover', category: 'Laundry/Cleaning', defaultUnit: 'bottle', isStandard: true },
    { name: 'Dishwasher tablets', category: 'Laundry/Cleaning', defaultUnit: 'pack', isStandard: true },
    { name: 'Dishwashing liquid', category: 'Laundry/Cleaning', defaultUnit: 'bottle', isStandard: true },
    { name: 'Hand soap', category: 'Laundry/Cleaning', defaultUnit: 'bottle', isStandard: true },
    { name: 'Disinfectant wipes', category: 'Laundry/Cleaning', defaultUnit: 'pack', isStandard: true },
    { name: 'Toilet cleaner', category: 'Laundry/Cleaning', defaultUnit: 'bottle', isStandard: true },
    { name: 'Floor cleaner', category: 'Laundry/Cleaning', defaultUnit: 'bottle', isStandard: true },
    { name: 'Glass cleaner', category: 'Laundry/Cleaning', defaultUnit: 'bottle', isStandard: true },
    { name: 'Sponges', category: 'Laundry/Cleaning', defaultUnit: 'pack', isStandard: true },
    { name: 'Trash bags', category: 'Laundry/Cleaning', defaultUnit: 'roll', isStandard: true },
    // Kitchen/Pantry
    { name: 'Eggs', category: 'Kitchen/Pantry', defaultUnit: 'dozen', isStandard: true },
    { name: 'Milk', category: 'Kitchen/Pantry', defaultUnit: 'liter', isStandard: true },
    { name: 'Bread', category: 'Kitchen/Pantry', defaultUnit: 'loaf', isStandard: true },
    { name: 'Rice', category: 'Kitchen/Pantry', defaultUnit: 'kg', isStandard: true },
    { name: 'Noodles', category: 'Kitchen/Pantry', defaultUnit: 'pack', isStandard: true },
    { name: 'Cooking oil', category: 'Kitchen/Pantry', defaultUnit: 'bottle', isStandard: true },
    { name: 'Salt', category: 'Kitchen/Pantry', defaultUnit: 'pack', isStandard: true },
    { name: 'Sugar', category: 'Kitchen/Pantry', defaultUnit: 'pack', isStandard: true },
    { name: 'Soy sauce', category: 'Kitchen/Pantry', defaultUnit: 'bottle', isStandard: true },
    { name: 'Vinegar', category: 'Kitchen/Pantry', defaultUnit: 'bottle', isStandard: true },
    { name: 'Coffee/Tea', category: 'Kitchen/Pantry', defaultUnit: 'pack', isStandard: true },
    // Toiletries
    { name: 'Toilet paper', category: 'Toiletries', defaultUnit: 'pack', isStandard: true },
    { name: 'Tissue paper', category: 'Toiletries', defaultUnit: 'box', isStandard: true },
    { name: 'Shampoo', category: 'Toiletries', defaultUnit: 'bottle', isStandard: true },
    { name: 'Body wash', category: 'Toiletries', defaultUnit: 'bottle', isStandard: true },
    { name: 'Toothpaste', category: 'Toiletries', defaultUnit: 'tube', isStandard: true },
    // Baby/Child
    { name: 'Diapers', category: 'Baby/Child', defaultUnit: 'pack', isStandard: true },
    { name: 'Wet wipes', category: 'Baby/Child', defaultUnit: 'pack', isStandard: true },
  ];

  for (const item of catalogItems) {
    await createShoppingCatalogItem({
      ...item,
      id: `catalog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}

async function seedMealItems(): Promise<void> {
  const existingItems = await getAllMealItems();
  if (existingItems.length > 0) return;

  const mealItems: Omit<MealItem, 'id'>[] = [
    // Breakfast
    { name: 'Toast & Eggs', mealType: 'breakfast', photoUrl: '/assets/meals/breakfast-toast-eggs.jpg', tags: ['quick', 'protein'], isStandard: true },
    { name: 'Oatmeal', mealType: 'breakfast', photoUrl: '/assets/meals/breakfast-oatmeal.jpg', tags: ['healthy', 'warm'], isStandard: true },
    { name: 'Cereal & Milk', mealType: 'breakfast', photoUrl: '/assets/meals/breakfast-cereal.jpg', tags: ['quick', 'kid-friendly'], isStandard: true },
    { name: 'Congee', mealType: 'breakfast', photoUrl: '/assets/meals/breakfast-congee.jpg', tags: ['asian', 'warm'], isStandard: true },
    { name: 'Yogurt & Fruit', mealType: 'breakfast', photoUrl: '/assets/meals/breakfast-yogurt.jpg', tags: ['healthy', 'quick'], isStandard: true },
    { name: 'Pancakes', mealType: 'breakfast', photoUrl: '/assets/meals/breakfast-pancakes.jpg', tags: ['weekend', 'kid-friendly'], isStandard: true },
    { name: 'Sandwich', mealType: 'breakfast', photoUrl: '/assets/meals/breakfast-sandwich.jpg', tags: ['quick', 'portable'], isStandard: true },
    // Lunch
    { name: 'Rice Bowl', mealType: 'lunch', photoUrl: '/assets/meals/lunch-rice-bowl.jpg', tags: ['asian', 'filling'], isStandard: true },
    { name: 'Noodle Soup', mealType: 'lunch', photoUrl: '/assets/meals/lunch-noodle-soup.jpg', tags: ['asian', 'warm'], isStandard: true },
    { name: 'Salad Bowl', mealType: 'lunch', photoUrl: '/assets/meals/lunch-salad.jpg', tags: ['healthy', 'light'], isStandard: true },
    { name: 'Bento Box', mealType: 'lunch', photoUrl: '/assets/meals/lunch-bento.jpg', tags: ['asian', 'balanced'], isStandard: true },
    { name: 'Pasta', mealType: 'lunch', photoUrl: '/assets/meals/lunch-pasta.jpg', tags: ['italian', 'kid-friendly'], isStandard: true },
    { name: 'Dumplings', mealType: 'lunch', photoUrl: '/assets/meals/lunch-dumplings.jpg', tags: ['asian', 'finger-food'], isStandard: true },
    // Dinner
    { name: 'Stir-fry & Rice', mealType: 'dinner', photoUrl: '/assets/meals/dinner-stirfry.jpg', tags: ['asian', 'quick'], isStandard: true },
    { name: 'Soup & Side Dish', mealType: 'dinner', photoUrl: '/assets/meals/dinner-soup.jpg', tags: ['warm', 'healthy'], isStandard: true },
    { name: 'Fish & Vegetables', mealType: 'dinner', photoUrl: '/assets/meals/dinner-fish.jpg', tags: ['healthy', 'protein'], isStandard: true },
    { name: 'Curry & Rice', mealType: 'dinner', photoUrl: '/assets/meals/dinner-curry.jpg', tags: ['asian', 'spicy'], isStandard: true },
    { name: 'Hotpot', mealType: 'dinner', photoUrl: '/assets/meals/dinner-hotpot.jpg', tags: ['asian', 'family'], isStandard: true },
    { name: 'Pasta Dinner', mealType: 'dinner', photoUrl: '/assets/meals/dinner-pasta.jpg', tags: ['italian', 'kid-friendly'], isStandard: true },
  ];

  for (const item of mealItems) {
    await createMealItem({
      ...item,
      id: `meal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    });
  }
}
