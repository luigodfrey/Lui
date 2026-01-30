import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { type Language, setLanguage, getCurrentLanguage } from '@/locales/i18n';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { User, UserRole, ThemePreset } from '@/types';

export function SettingsPage() {
  const { t } = useTranslation();
  const { currentUser, isOwner, users, logout, addUser, editUser, removeUser } = useAuth();
  const { 
    themePreset, mode, accentColor, fontSize, 
    alarmVolume, alarmMuted,
    setThemePreset, setMode, setAccentColor, setFontSize,
    setAlarmVolume, setAlarmMuted,
    saveSettings, isDark 
  } = useTheme();
  
  const [activeTab, setActiveTab] = useState('theme');
  const [language, setLanguageState] = useState<Language>(getCurrentLanguage());
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('Helper');
  const [saving, setSaving] = useState(false);

  const handleLanguageChange = (lang: Language) => {
    setLanguageState(lang);
    setLanguage(lang);
  };

  const handleSaveTheme = async () => {
    setSaving(true);
    await saveSettings();
    setSaving(false);
  };

  const handleAddUser = async () => {
    if (!newUserName || !newUserEmail) return;
    
    await addUser({
      email: newUserEmail,
      name: newUserName,
      role: newUserRole,
      passwordHash: 'demo-hash-password',
      isActive: true,
    });
    
    setShowUserDialog(false);
    setNewUserName('');
    setNewUserEmail('');
    setNewUserRole('Helper');
  };

  const handleEditUser = async () => {
    if (!editingUser) return;
    
    await editUser(editingUser);
    setEditingUser(null);
  };

  const themePresets: { value: ThemePreset; label: string; colors: string[] }[] = [
    { value: 'classic-light', label: t('settings.classicLight'), colors: ['#f8fafc', '#3b82f6'] },
    { value: 'classic-dark', label: t('settings.classicDark'), colors: ['#0f172a', '#60a5fa'] },
    { value: 'ocean-blue', label: t('settings.oceanBlue'), colors: ['#f0f9ff', '#0ea5e9'] },
    { value: 'mint-green', label: t('settings.mintGreen'), colors: ['#f0fdf4', '#10b981'] },
    { value: 'warm-sand', label: t('settings.warmSand'), colors: ['#fffbeb', '#d97706'] },
    { value: 'lavender', label: t('settings.lavender'), colors: ['#faf5ff', '#8b5cf6'] },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className={`page-header ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
        <div className="flex items-center justify-between">
          <h1 className={`page-title ${isDark ? 'text-white' : ''}`}>{t('settings.title')}</h1>
          <Button variant="outline" size="sm" onClick={logout}>
            {t('auth.logout')}
          </Button>
        </div>
        <p className={`text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          {currentUser?.name} ({t(currentUser?.role === 'Owner' ? 'auth.owner' : 'auth.helper')})
        </p>
      </div>

      {/* Settings Tabs */}
      <div className="p-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="theme">{t('settings.theme')}</TabsTrigger>
            <TabsTrigger value="language">{t('settings.language')}</TabsTrigger>
            {isOwner() && <TabsTrigger value="users">{t('settings.users')}</TabsTrigger>}
          </TabsList>

          {/* Theme Tab */}
          <TabsContent value="theme" className="space-y-6">
            {/* Preset Themes */}
            <div>
              <Label className="mb-2 block">{t('settings.preset')}</Label>
              <div className="grid grid-cols-2 gap-2">
                {themePresets.map(preset => (
                  <button
                    key={preset.value}
                    onClick={() => setThemePreset(preset.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${
                      themePreset === preset.value 
                        ? 'border-blue-500' 
                        : isDark ? 'border-slate-700' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex gap-2 mb-2">
                      {preset.colors.map((color, idx) => (
                        <div 
                          key={idx} 
                          className="w-6 h-6 rounded-full border"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                    <span className={`text-sm font-medium ${isDark ? 'text-white' : ''}`}>
                      {preset.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode */}
            <div>
              <Label className="mb-2 block">{t('settings.mode')}</Label>
              <Select value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
                <SelectTrigger className={isDark ? 'bg-slate-700 border-slate-600' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">{t('settings.light')}</SelectItem>
                  <SelectItem value="dark">{t('settings.dark')}</SelectItem>
                  <SelectItem value="system">{t('settings.system')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Accent Color */}
            <div>
              <Label className="mb-2 block">{t('settings.accentColor')}</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-12 h-12 rounded-lg cursor-pointer"
                />
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className={`flex-1 ${isDark ? 'bg-slate-700 border-slate-600' : ''}`}
                />
              </div>
            </div>

            {/* Font Size */}
            <div>
              <Label className="mb-2 block">{t('settings.fontSize')}</Label>
              <Select value={fontSize} onValueChange={(v) => setFontSize(v as typeof fontSize)}>
                <SelectTrigger className={isDark ? 'bg-slate-700 border-slate-600' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">{t('settings.normal')}</SelectItem>
                  <SelectItem value="large">{t('settings.large')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Alarm Settings */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-700' : 'bg-slate-100'}`}>
              <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : ''}`}>
                {t('arrival.title')}
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>{t('arrival.muteAlarm')}</Label>
                  <Switch
                    checked={alarmMuted}
                    onCheckedChange={setAlarmMuted}
                  />
                </div>

                {!alarmMuted && (
                  <>
                    <div>
                      <Label className="mb-2 block">{t('arrival.alarmVolume')}: {alarmVolume}%</Label>
                      <Slider
                        value={[alarmVolume]}
                        onValueChange={(v) => setAlarmVolume(v[0])}
                        max={100}
                        step={10}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            <Button 
              onClick={handleSaveTheme} 
              disabled={saving}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {saving ? t('common.loading') : t('settings.saveSettings')}
            </Button>
          </TabsContent>

          {/* Language Tab */}
          <TabsContent value="language" className="space-y-4">
            <div>
              <Label className="mb-2 block">{t('settings.language')}</Label>
              <div className="space-y-2">
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                    language === 'en' 
                      ? 'border-blue-500' 
                      : isDark ? 'border-slate-700' : 'border-slate-200'
                  }`}
                >
                  <div className={`font-medium ${isDark ? 'text-white' : ''}`}>
                    {t('settings.english')}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    English
                  </div>
                </button>
                
                <button
                  onClick={() => handleLanguageChange('zh-Hant')}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-colors ${
                    language === 'zh-Hant' 
                      ? 'border-blue-500' 
                      : isDark ? 'border-slate-700' : 'border-slate-200'
                  }`}
                >
                  <div className={`font-medium ${isDark ? 'text-white' : ''}`}>
                    {t('settings.chinese')}
                  </div>
                  <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    繁體中文
                  </div>
                </button>
              </div>
            </div>
          </TabsContent>

          {/* Users Tab (Owner only) */}
          {isOwner() && (
            <TabsContent value="users" className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className={`font-semibold ${isDark ? 'text-white' : ''}`}>
                  {t('settings.manageUsers')}
                </h3>
                <Button 
                  size="sm" 
                  onClick={() => {
                    setEditingUser(null);
                    setNewUserName('');
                    setNewUserEmail('');
                    setNewUserRole('Helper');
                    setShowUserDialog(true);
                  }}
                >
                  + {t('settings.addUser')}
                </Button>
              </div>

              <div className="space-y-2">
                {users.map(user => (
                  <div 
                    key={user.id} 
                    className={`p-4 rounded-xl border ${
                      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className={`font-medium ${isDark ? 'text-white' : ''}`}>
                          {user.name}
                        </div>
                        <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {user.email} • {t(user.role === 'Owner' ? 'auth.owner' : 'auth.helper')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingUser(user);
                            setNewUserName(user.name);
                            setNewUserEmail(user.email);
                            setNewUserRole(user.role);
                            setShowUserDialog(true);
                          }}
                          className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => removeUser(user.id)}
                            className={`p-2 rounded-lg text-red-500 ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* User Dialog */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent className={isDark ? 'bg-slate-800 text-white' : ''}>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? t('settings.editUser') : t('settings.addUser')}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label className="mb-1 block">{t('settings.name')}</Label>
              <Input
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                placeholder={t('settings.name')}
                className={isDark ? 'bg-slate-700 border-slate-600' : ''}
              />
            </div>
            
            <div>
              <Label className="mb-1 block">{t('auth.email')}</Label>
              <Input
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                placeholder="email@example.com"
                type="email"
                disabled={!!editingUser}
                className={isDark ? 'bg-slate-700 border-slate-600' : ''}
              />
            </div>
            
            <div>
              <Label className="mb-1 block">{t('auth.role')}</Label>
              <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as UserRole)}>
                <SelectTrigger className={isDark ? 'bg-slate-700 border-slate-600' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Owner">{t('auth.owner')}</SelectItem>
                  <SelectItem value="Helper">{t('auth.helper')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowUserDialog(false)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={editingUser ? handleEditUser : handleAddUser}
                disabled={!newUserName || !newUserEmail}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {editingUser ? t('common.save') : t('common.create')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
