import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllMealItems, getWeeklyMealPlanByWeekStart, createWeeklyMealPlan, getDailyMealOverridesByDate, createDailyMealOverride, clearDailyMealOverrideByDateAndType, createMealItem } from '@/db';
import { getWeekStart, addDaysToDate, formatDateShort, getHKTime } from '@/utils/date';
import type { MealItem, WeeklyMealPlan, DailyMealOverride, MealType, DayMealPlan } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function MealsPage() {
  const { t } = useTranslation();
  const { currentUser, isOwner } = useAuth();
  const { isDark } = useTheme();
  const [mealItems, setMealItems] = useState<MealItem[]>([]);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyMealPlan | null>(null);
  const [dailyOverrides, setDailyOverrides] = useState<DailyMealOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'week'>('today');
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [showAddMealDialog, setShowAddMealDialog] = useState(false);
  const [overrideDate, setOverrideDate] = useState<Date | null>(null);
  const [overrideMealType, setOverrideMealType] = useState<MealType>('breakfast');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customItems, setCustomItems] = useState<string[]>([]);
  const [newCustomItem, setNewCustomItem] = useState('');
  const [overrideNote, setOverrideNote] = useState('');
  
  // New meal item form
  const [newMealName, setNewMealName] = useState('');
  const [newMealType, setNewMealType] = useState<MealType>('breakfast');
  const [newMealPhoto, setNewMealPhoto] = useState('');
  const [newMealTags, setNewMealTags] = useState('');

  const today = getHKTime();
  const tomorrow = addDaysToDate(today, 1);
  const weekStart = getWeekStart(today);

  const loadData = useCallback(async () => {
    try {
      const [items, plan, todayOverrides, tomorrowOverrides] = await Promise.all([
        getAllMealItems(),
        getWeeklyMealPlanByWeekStart(weekStart),
        getDailyMealOverridesByDate(today),
        getDailyMealOverridesByDate(tomorrow),
      ]);
      
      setMealItems(items);
      setDailyOverrides([...todayOverrides, ...tomorrowOverrides]);
      
      if (plan) {
        setWeeklyPlan(plan);
      } else if (isOwner()) {
        // Create default weekly plan
        const defaultPlan: WeeklyMealPlan = {
          id: `plan-${Date.now()}`,
          weekStartDate: weekStart,
          monday: { breakfastSelectedItems: [], lunchSelectedItems: [], dinnerSelectedItems: [] },
          tuesday: { breakfastSelectedItems: [], lunchSelectedItems: [], dinnerSelectedItems: [] },
          wednesday: { breakfastSelectedItems: [], lunchSelectedItems: [], dinnerSelectedItems: [] },
          thursday: { breakfastSelectedItems: [], lunchSelectedItems: [], dinnerSelectedItems: [] },
          friday: { breakfastSelectedItems: [], lunchSelectedItems: [], dinnerSelectedItems: [] },
          saturday: { breakfastSelectedItems: [], lunchSelectedItems: [], dinnerSelectedItems: [] },
          sunday: { breakfastSelectedItems: [], lunchSelectedItems: [], dinnerSelectedItems: [] },
          createdBy: currentUser?.id || '',
          updatedAt: getHKTime(),
        };
        await createWeeklyMealPlan(defaultPlan);
        setWeeklyPlan(defaultPlan);
      }
    } catch (error) {
      console.error('Failed to load meals:', error);
    } finally {
      setLoading(false);
    }
  }, [weekStart, isOwner, currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getDayPlan = (date: Date): DayMealPlan | null => {
    if (!weeklyPlan) return null;
    
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[date.getDay()] as keyof WeeklyMealPlan;
    return weeklyPlan[dayName] as DayMealPlan;
  };

  const getOverrideForMeal = (date: Date, mealType: MealType): DailyMealOverride | undefined => {
    return dailyOverrides.find(o => {
      const oDate = new Date(o.date);
      oDate.setHours(0, 0, 0, 0);
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      return oDate.getTime() === targetDate.getTime() && o.mealType === mealType;
    });
  };

  const getMealsForDisplay = (date: Date, mealType: MealType): { items: string[]; note?: string; isOverride: boolean } => {
    const override = getOverrideForMeal(date, mealType);
    if (override) {
      return { items: override.selectedItems, note: override.note, isOverride: true };
    }
    
    const dayPlan = getDayPlan(date);
    if (!dayPlan) return { items: [], isOverride: false };
    
    switch (mealType) {
      case 'breakfast':
        return { items: dayPlan.breakfastSelectedItems, note: dayPlan.breakfastNote, isOverride: false };
      case 'lunch':
        return { items: dayPlan.lunchSelectedItems, note: dayPlan.lunchNote, isOverride: false };
      case 'dinner':
        return { items: dayPlan.dinnerSelectedItems, note: dayPlan.dinnerNote, isOverride: false };
    }
  };

  const handleOpenOverride = (date: Date, mealType: MealType) => {
    setOverrideDate(date);
    setOverrideMealType(mealType);
    
    const existing = getOverrideForMeal(date, mealType);
    if (existing) {
      setSelectedItems(existing.selectedItems.filter(id => mealItems.some(m => m.id === id)));
      setCustomItems(existing.selectedItems.filter(id => !mealItems.some(m => m.id === id)));
      setOverrideNote(existing.note || '');
    } else {
      const dayPlan = getDayPlan(date);
      if (dayPlan) {
        const items = mealType === 'breakfast' ? dayPlan.breakfastSelectedItems :
                     mealType === 'lunch' ? dayPlan.lunchSelectedItems :
                     dayPlan.dinnerSelectedItems;
        setSelectedItems(items.filter(id => mealItems.some(m => m.id === id)));
        setCustomItems(items.filter(id => !mealItems.some(m => m.id === id)));
      } else {
        setSelectedItems([]);
        setCustomItems([]);
      }
      setOverrideNote('');
    }
    setShowOverrideDialog(true);
  };

  const handleSaveOverride = async () => {
    if (!overrideDate || !currentUser) return;

    const allItems = [...selectedItems, ...customItems];
    
    // Clear existing override first
    await clearDailyMealOverrideByDateAndType(overrideDate, overrideMealType);
    
    // Create new override
    const override: DailyMealOverride = {
      id: `override-${Date.now()}`,
      date: overrideDate,
      mealType: overrideMealType,
      selectedItems: allItems,
      note: overrideNote,
      createdBy: currentUser.id,
      updatedAt: getHKTime(),
    };
    
    await createDailyMealOverride(override);
    setShowOverrideDialog(false);
    await loadData();
  };

  const handleAddMealItem = async () => {
    if (!newMealName || !currentUser) return;

    const newItem: MealItem = {
      id: `meal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newMealName,
      mealType: newMealType,
      photoUrl: newMealPhoto || `https://placehold.co/200x150/e2e8f0/64748b?text=${encodeURIComponent(newMealName)}`,
      tags: newMealTags.split(',').map(t => t.trim()).filter(Boolean),
      isStandard: false,
    };

    await createMealItem(newItem);
    setShowAddMealDialog(false);
    setNewMealName('');
    setNewMealPhoto('');
    setNewMealTags('');
    await loadData();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Photo must be less than 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setter(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const toggleMealItem = (itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const addCustomItem = () => {
    if (newCustomItem.trim()) {
      setCustomItems(prev => [...prev, newCustomItem.trim()]);
      setNewCustomItem('');
    }
  };

  const removeCustomItem = (item: string) => {
    setCustomItems(prev => prev.filter(i => i !== item));
  };

  const getMealItemsByType = (type: MealType) => mealItems.filter(m => m.mealType === type);

  const MealDisplay = ({ date, label }: { date: Date; label: string }) => {
    const meals: MealType[] = ['breakfast', 'lunch', 'dinner'];
    
    return (
      <div className="space-y-4">
        <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : ''}`}>
          {label} ({formatDateShort(date)})
        </h2>
        
        {meals.map(mealType => {
          const { items, note, isOverride } = getMealsForDisplay(date, mealType);
          const mealItemsList = items.map(id => 
            mealItems.find(m => m.id === id) || { id, name: id, photoUrl: '' }
          );
          
          return (
            <div key={mealType} className={`card ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <h3 className={`font-semibold capitalize ${isDark ? 'text-white' : ''}`}>
                    {t(`meals.${mealType}`)}
                  </h3>
                  {isOverride && (
                    <Badge className="bg-purple-100 text-purple-600">
                      {t('meals.hasOverride')}
                    </Badge>
                  )}
                  {!isOverride && items.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {t('meals.noOverride')}
                    </Badge>
                  )}
                </div>
                {isOwner() && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenOverride(date, mealType)}
                  >
                    {isOverride ? t('common.edit') : t('meals.overrideToday')}
                  </Button>
                )}
              </div>
              
              {items.length === 0 ? (
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {t('meals.noOverride')}
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-2">
                    {mealItemsList.map((item, idx) => (
                      <div key={idx} className="meal-tile">
                        {item.photoUrl ? (
                          <img 
                            src={item.photoUrl} 
                            alt={item.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://placehold.co/200x150/e2e8f0/64748b?text=${encodeURIComponent(item.name)}`;
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-200 flex items-center justify-center">
                            <span className="text-slate-400 text-2xl">🍽️</span>
                          </div>
                        )}
                        <div className="meal-tile-label">{item.name}</div>
                      </div>
                    ))}
                  </div>
                  {note && (
                    <p className={`mt-3 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {t('meals.note')}: {note}
                    </p>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    );
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
        <h1 className={`page-title ${isDark ? 'text-white' : ''}`}>{t('meals.title')}</h1>
        
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">{t('meals.today')}</TabsTrigger>
            <TabsTrigger value="tomorrow">{t('meals.tomorrow')}</TabsTrigger>
            {isOwner() && <TabsTrigger value="week">{t('meals.weeklyPlan')}</TabsTrigger>}
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'today' && <MealDisplay date={today} label={t('meals.today')} />}
        {activeTab === 'tomorrow' && <MealDisplay date={tomorrow} label={t('meals.tomorrow')} />}
        
        {activeTab === 'week' && isOwner() && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {t('meals.weeklyPlan')} - Week of {formatDateShort(weekStart)}
              </p>
              <Button
                size="sm"
                onClick={() => setShowAddMealDialog(true)}
                variant="outline"
              >
                + {t('meals.addMeal')}
              </Button>
            </div>
            
            {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map((day, idx) => {
              const dayDate = addDaysToDate(weekStart, idx);
              const dayPlan = getDayPlan(dayDate);
              
              return (
                <div key={day} className={`card ${isDark ? 'bg-slate-800 border-slate-700' : ''}`}>
                  <h3 className={`font-semibold capitalize mb-3 ${isDark ? 'text-white' : ''}`}>
                    {t(`meals.${day}`)} ({formatDateShort(dayDate)})
                  </h3>
                  
                  <div className="grid grid-cols-3 gap-2">
                    {(['breakfast', 'lunch', 'dinner'] as MealType[]).map(mealType => {
                      const items = mealType === 'breakfast' ? dayPlan?.breakfastSelectedItems || [] :
                                   mealType === 'lunch' ? dayPlan?.lunchSelectedItems || [] :
                                   dayPlan?.dinnerSelectedItems || [];
                      
                      return (
                        <button
                          key={mealType}
                          onClick={() => handleOpenOverride(dayDate, mealType)}
                          className={`p-3 rounded-lg border text-left ${
                            isDark 
                              ? 'bg-slate-700 border-slate-600 hover:border-blue-500' 
                              : 'bg-slate-50 border-slate-200 hover:border-blue-500'
                          }`}
                        >
                          <div className={`text-xs uppercase mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {t(`meals.${mealType}`)}
                          </div>
                          <div className={`text-sm font-medium ${isDark ? 'text-white' : ''}`}>
                            {items.length > 0 
                              ? `${items.length} items` 
                              : t('meals.selectItems')}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Override Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent className={`max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-800 text-white' : ''}`}>
          <DialogHeader>
            <DialogTitle>
              {formatDateShort(overrideDate || new Date())} - {t(`meals.${overrideMealType}`)}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Meal Items */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('meals.selectItems')}</label>
              <div className="grid grid-cols-3 gap-2">
                {getMealItemsByType(overrideMealType).map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleMealItem(item.id)}
                    className={`meal-tile ${selectedItems.includes(item.id) ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <img 
                      src={item.photoUrl} 
                      alt={item.name}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://placehold.co/200x150/e2e8f0/64748b?text=${encodeURIComponent(item.name)}`;
                      }}
                    />
                    <div className="meal-tile-label">{item.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Items */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('meals.customItem')}</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={newCustomItem}
                  onChange={(e) => setNewCustomItem(e.target.value)}
                  placeholder={t('meals.addCustom')}
                  className={isDark ? 'bg-slate-700 border-slate-600' : ''}
                  onKeyPress={(e) => e.key === 'Enter' && addCustomItem()}
                />
                <Button onClick={addCustomItem} variant="outline">
                  {t('common.add')}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {customItems.map((item, idx) => (
                  <Badge key={idx} variant="secondary" className="flex items-center gap-1">
                    {item}
                    <button onClick={() => removeCustomItem(item)} className="ml-1">×</button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium mb-1">{t('meals.note')}</label>
              <Input
                value={overrideNote}
                onChange={(e) => setOverrideNote(e.target.value)}
                placeholder={t('common.optional')}
                className={isDark ? 'bg-slate-700 border-slate-600' : ''}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowOverrideDialog(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleSaveOverride}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Meal Item Dialog */}
      <Dialog open={showAddMealDialog} onOpenChange={setShowAddMealDialog}>
        <DialogContent className={`max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-800 text-white' : ''}`}>
          <DialogHeader>
            <DialogTitle>{t('meals.addMeal')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('meals.mealName')} *</label>
              <Input
                value={newMealName}
                onChange={(e) => setNewMealName(e.target.value)}
                placeholder="e.g., Fried Rice, Steamed Fish..."
                className={isDark ? 'bg-slate-700 border-slate-600' : ''}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t('meals.mealType')} *</label>
              <Select value={newMealType} onValueChange={(v) => setNewMealType(v as MealType)}>
                <SelectTrigger className={isDark ? 'bg-slate-700 border-slate-600' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">{t('meals.breakfast')}</SelectItem>
                  <SelectItem value="lunch">{t('meals.lunch')}</SelectItem>
                  <SelectItem value="dinner">{t('meals.dinner')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('meals.tags')}</label>
              <Input
                value={newMealTags}
                onChange={(e) => setNewMealTags(e.target.value)}
                placeholder="e.g., rice, asian, quick (comma separated)"
                className={isDark ? 'bg-slate-700 border-slate-600' : ''}
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('meals.photo')}</label>
              {newMealPhoto ? (
                <div className="relative">
                  <img src={newMealPhoto} alt="Meal" className="w-full h-40 object-cover rounded-lg" />
                  <button
                    onClick={() => setNewMealPhoto('')}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full"
                  >
                    ×
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-slate-500">Click to add photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoUpload(e, setNewMealPhoto)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddMealDialog(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleAddMealItem}
                disabled={!newMealName}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
