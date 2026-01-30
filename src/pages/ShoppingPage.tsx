import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { getAllShoppingCatalogItems, getAllShoppingListItems, createShoppingListItem, updateShoppingListItem, deleteShoppingListItem, createShoppingCatalogItem } from '@/db';
import { getHKTime, formatDate } from '@/utils/date';
import type { ShoppingItemCatalog, ShoppingListItem, TaskPriority, ShoppingItemStatus } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export function ShoppingPage() {
  const { t } = useTranslation();
  const { currentUser, isOwner, users } = useAuth();
  const { isDark } = useTheme();
  const [catalog, setCatalog] = useState<ShoppingItemCatalog[]>([]);
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'catalog'>('list');
  const [statusFilter, setStatusFilter] = useState<ShoppingItemStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddToCatalogDialog, setShowAddToCatalogDialog] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<ShoppingItemCatalog | null>(null);
  const [customName, setCustomName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<string>('');
  
  // New catalog item form
  const [newCatalogName, setNewCatalogName] = useState('');
  const [newCatalogCategory, setNewCatalogCategory] = useState('');
  const [newCatalogUnit, setNewCatalogUnit] = useState('');
  const [newCatalogPhoto, setNewCatalogPhoto] = useState('');

  const loadData = useCallback(async () => {
    try {
      const [catalogItems, listItems] = await Promise.all([
        getAllShoppingCatalogItems(),
        getAllShoppingListItems(),
      ]);
      setCatalog(catalogItems);
      setItems(listItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Failed to load shopping data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddFromCatalog = (catalogItem: ShoppingItemCatalog) => {
    setSelectedCatalogItem(catalogItem);
    setCustomName('');
    setQuantity(1);
    setUnit(catalogItem.defaultUnit);
    setCategory(catalogItem.category);
    setPriority('Medium');
    setAssignedTo('');
    setNotes('');
    setPhoto('');
    setShowAddDialog(true);
  };

  const handleAddCustom = () => {
    setSelectedCatalogItem(null);
    setCustomName('');
    setQuantity(1);
    setUnit('');
    setCategory('');
    setPriority('Medium');
    setAssignedTo('');
    setNotes('');
    setPhoto('');
    setShowAddDialog(true);
  };

  const handleSaveItem = async () => {
    if (!currentUser) return;

    const newItem: ShoppingListItem = {
      id: `shop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      catalogItemId: selectedCatalogItem?.id,
      customName: selectedCatalogItem ? undefined : customName,
      category: selectedCatalogItem?.category || category || 'Other',
      quantity,
      unit: unit || 'pcs',
      priority,
      status: 'ToBuy',
      assignedTo: assignedTo || undefined,
      notes: notes || undefined,
      photo: photo || undefined,
      createdBy: currentUser.id,
      createdAt: getHKTime(),
      updatedAt: getHKTime(),
    };

    await createShoppingListItem(newItem);
    setShowAddDialog(false);
    await loadData();
  };

  const handleAddToCatalog = async () => {
    if (!newCatalogName || !newCatalogCategory) return;

    const newCatalogItem: ShoppingItemCatalog = {
      id: `catalog-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newCatalogName,
      category: newCatalogCategory,
      defaultUnit: newCatalogUnit || 'pcs',
      isStandard: false,
    };

    await createShoppingCatalogItem(newCatalogItem);
    setShowAddToCatalogDialog(false);
    setNewCatalogName('');
    setNewCatalogCategory('');
    setNewCatalogUnit('');
    setNewCatalogPhoto('');
    await loadData();
  };

  const handleToggleStatus = async (item: ShoppingListItem) => {
    const newStatus: ShoppingItemStatus = item.status === 'Bought' ? 'ToBuy' : 'Bought';
    await updateShoppingListItem({
      ...item,
      status: newStatus,
      boughtAt: newStatus === 'Bought' ? getHKTime() : undefined,
      boughtBy: newStatus === 'Bought' ? currentUser?.id : undefined,
    });
    await loadData();
  };

  const handleDeleteItem = async (id: string) => {
    await deleteShoppingListItem(id);
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

  // Filter items
  const filteredItems = items.filter(item => {
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery) {
      const name = item.customName || catalog.find(c => c.id === item.catalogItemId)?.name || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Filter catalog
  const filteredCatalog = catalog.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const helpers = users.filter(u => u.role === 'Helper');

  const getPriorityColor = (p: TaskPriority) => {
    switch (p) {
      case 'High': return 'bg-red-100 text-red-600';
      case 'Medium': return 'bg-amber-100 text-amber-600';
      case 'Low': return 'bg-green-100 text-green-600';
    }
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
        <h1 className={`page-title ${isDark ? 'text-white' : ''}`}>{t('shopping.title')}</h1>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">{t('shopping.list')}</TabsTrigger>
            <TabsTrigger value="catalog">{t('shopping.catalog')}</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search and Filter */}
        <div className="mt-3 space-y-2">
          <Input
            placeholder={t('shopping.searchCatalog')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={isDark ? 'bg-slate-700 border-slate-600' : ''}
          />
          {activeTab === 'list' && (
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
              <SelectTrigger className={isDark ? 'bg-slate-700 border-slate-600' : ''}>
                <SelectValue placeholder={t('shopping.filter')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="ToBuy">{t('shopping.toBuy')}</SelectItem>
                <SelectItem value="Bought">{t('shopping.bought')}</SelectItem>
                <SelectItem value="OutOfStock">{t('shopping.outOfStock')}</SelectItem>
                <SelectItem value="Deferred">{t('shopping.deferred')}</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'list' ? (
          <div className="space-y-3">
            {/* Add Custom Button */}
            <Button
              onClick={handleAddCustom}
              variant="outline"
              className="w-full"
            >
              + {t('shopping.addItem')}
            </Button>

            {filteredItems.length === 0 ? (
              <div className={`text-center py-12 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
                </svg>
                <p>{t('shopping.noItems')}</p>
              </div>
            ) : (
              filteredItems.map(item => {
                const catalogItem = catalog.find(c => c.id === item.catalogItemId);
                const name = item.customName || catalogItem?.name || 'Unknown';
                
                return (
                  <div
                    key={item.id}
                    className={`card ${isDark ? 'bg-slate-800 border-slate-700' : ''} ${
                      item.status === 'Bought' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.status === 'Bought'}
                        onCheckedChange={() => handleToggleStatus(item)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`font-medium ${isDark ? 'text-white' : ''} ${item.status === 'Bought' ? 'line-through' : ''}`}>
                            {name}
                          </span>
                          <Badge className={getPriorityColor(item.priority)}>
                            {t(`tasks.${item.priority.toLowerCase()}`)}
                          </Badge>
                        </div>
                        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                          {item.quantity} {item.unit} • {item.category}
                        </div>
                        {item.photo && (
                          <div className="mt-2">
                            <img 
                              src={item.photo} 
                              alt={name} 
                              className="w-20 h-20 object-cover rounded-lg"
                            />
                          </div>
                        )}
                        {item.assignedTo && (
                          <div className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            {t('shopping.assignTo')}: {users.find(u => u.id === item.assignedTo)?.name}
                          </div>
                        )}
                        {item.notes && (
                          <div className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            {item.notes}
                          </div>
                        )}
                        {item.boughtAt && (
                          <div className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
                            {t('shopping.bought')}: {formatDate(item.boughtAt)}
                          </div>
                        )}
                      </div>
                      {isOwner() && (
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Add to Catalog Button (Owner only) */}
            {isOwner() && (
              <Button
                onClick={() => setShowAddToCatalogDialog(true)}
                variant="outline"
                className="w-full"
              >
                + {t('shopping.addToCatalog')}
              </Button>
            )}
            
            {/* Categories */}
            {['Laundry/Cleaning', 'Kitchen/Pantry', 'Toiletries', 'Baby/Child', 'Other'].map(cat => {
              const catItems = filteredCatalog.filter(c => c.category === cat);
              if (catItems.length === 0) return null;
              
              return (
                <div key={cat}>
                  <h3 className={`font-semibold mb-2 ${isDark ? 'text-white' : ''}`}>{cat}</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {catItems.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleAddFromCatalog(item)}
                        className={`p-3 text-left rounded-lg border transition-colors ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 hover:border-blue-500' 
                            : 'bg-white border-slate-200 hover:border-blue-500'
                        }`}
                      >
                        <div className={`font-medium text-sm ${isDark ? 'text-white' : ''}`}>
                          {item.name}
                        </div>
                        <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {item.defaultUnit}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Item Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className={`max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-800 text-white' : ''}`}>
          <DialogHeader>
            <DialogTitle>{t('shopping.addItem')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedCatalogItem ? (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
                <div className="font-medium">{selectedCatalogItem.name}</div>
                <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {selectedCatalogItem.category}
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium mb-1">{t('shopping.itemName')} *</label>
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder={t('shopping.customItem')}
                  className={isDark ? 'bg-slate-700 border-slate-600' : ''}
                />
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">{t('shopping.quantity')}</label>
                <Input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  min={1}
                  className={isDark ? 'bg-slate-700 border-slate-600' : ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t('shopping.unit')}</label>
                <Input
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  placeholder="pcs"
                  className={isDark ? 'bg-slate-700 border-slate-600' : ''}
                />
              </div>
            </div>

            {!selectedCatalogItem && (
              <div>
                <label className="block text-sm font-medium mb-1">{t('shopping.category')} *</label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className={isDark ? 'bg-slate-700 border-slate-600' : ''}>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laundry/Cleaning">Laundry/Cleaning</SelectItem>
                    <SelectItem value="Kitchen/Pantry">Kitchen/Pantry</SelectItem>
                    <SelectItem value="Toiletries">Toiletries</SelectItem>
                    <SelectItem value="Baby/Child">Baby/Child</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-1">{t('tasks.priority')}</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
                <SelectTrigger className={isDark ? 'bg-slate-700 border-slate-600' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="High">{t('tasks.high')}</SelectItem>
                  <SelectItem value="Medium">{t('tasks.medium')}</SelectItem>
                  <SelectItem value="Low">{t('tasks.low')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('shopping.assignTo')}</label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger className={isDark ? 'bg-slate-700 border-slate-600' : ''}>
                  <SelectValue placeholder={t('common.optional')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('common.none')}</SelectItem>
                  {helpers.map(h => (
                    <SelectItem key={h.id} value={h.id}>{h.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('shopping.notes')}</label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('common.optional')}
                className={isDark ? 'bg-slate-700 border-slate-600' : ''}
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('shopping.photo')}</label>
              {photo ? (
                <div className="relative">
                  <img src={photo} alt="Item" className="w-full h-40 object-cover rounded-lg" />
                  <button
                    onClick={() => setPhoto('')}
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
                    onChange={(e) => handlePhotoUpload(e, setPhoto)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddDialog(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleSaveItem}
                disabled={!selectedCatalogItem && (!customName || !category)}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add to Catalog Dialog */}
      <Dialog open={showAddToCatalogDialog} onOpenChange={setShowAddToCatalogDialog}>
        <DialogContent className={`max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-800 text-white' : ''}`}>
          <DialogHeader>
            <DialogTitle>{t('shopping.addToCatalog')}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t('shopping.itemName')} *</label>
              <Input
                value={newCatalogName}
                onChange={(e) => setNewCatalogName(e.target.value)}
                placeholder="Item name"
                className={isDark ? 'bg-slate-700 border-slate-600' : ''}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">{t('shopping.category')} *</label>
              <Select value={newCatalogCategory} onValueChange={setNewCatalogCategory}>
                <SelectTrigger className={isDark ? 'bg-slate-700 border-slate-600' : ''}>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Laundry/Cleaning">Laundry/Cleaning</SelectItem>
                  <SelectItem value="Kitchen/Pantry">Kitchen/Pantry</SelectItem>
                  <SelectItem value="Toiletries">Toiletries</SelectItem>
                  <SelectItem value="Baby/Child">Baby/Child</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t('shopping.unit')}</label>
              <Input
                value={newCatalogUnit}
                onChange={(e) => setNewCatalogUnit(e.target.value)}
                placeholder="pcs, bottle, pack..."
                className={isDark ? 'bg-slate-700 border-slate-600' : ''}
              />
            </div>

            {/* Photo Upload for Catalog */}
            <div>
              <label className="block text-sm font-medium mb-2">{t('shopping.photo')}</label>
              {newCatalogPhoto ? (
                <div className="relative">
                  <img src={newCatalogPhoto} alt="Item" className="w-full h-40 object-cover rounded-lg" />
                  <button
                    onClick={() => setNewCatalogPhoto('')}
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
                    onChange={(e) => handlePhotoUpload(e, setNewCatalogPhoto)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowAddToCatalogDialog(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={handleAddToCatalog}
                disabled={!newCatalogName || !newCatalogCategory}
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
