import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '@/types';
import { getUserByEmail, getAllUsers, createUser, updateUser, deleteUser, saveUserPreferences } from '@/db';
import { seedDatabase } from '@/db/seed';

interface AuthContextType {
  currentUser: User | null;
  users: User[];
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isOwner: () => boolean;
  isHelper: () => boolean;
  refreshUsers: () => Promise<void>;
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editUser: (user: User) => Promise<void>;
  removeUser: (id: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo password is "password" for all accounts
const DEMO_PASSWORD = 'password';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize database and seed data
  useEffect(() => {
    const init = async () => {
      try {
        await seedDatabase();
        const allUsers = await getAllUsers();
        setUsers(allUsers);
      } catch (error) {
        console.error('Failed to initialize database:', error);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // Check for saved session
  useEffect(() => {
    const savedUserId = localStorage.getItem('currentUserId');
    if (savedUserId && !currentUser) {
      const loadUser = async () => {
        const allUsers = await getAllUsers();
        const savedUser = allUsers.find(u => u.id === savedUserId);
        if (savedUser) {
          setCurrentUser(savedUser);
        }
      };
      loadUser();
    }
  }, [currentUser]);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    // For demo, accept any password as "password"
    if (password !== DEMO_PASSWORD) {
      return false;
    }

    const user = await getUserByEmail(email);
    if (user && user.isActive) {
      setCurrentUser(user);
      localStorage.setItem('currentUserId', user.id);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem('currentUserId');
  }, []);

  const isOwner = useCallback(() => {
    return currentUser?.role === 'Owner';
  }, [currentUser]);

  const isHelper = useCallback(() => {
    return currentUser?.role === 'Helper';
  }, [currentUser]);

  const refreshUsers = useCallback(async () => {
    const allUsers = await getAllUsers();
    setUsers(allUsers);
  }, []);

  const addUser = useCallback(async (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await createUser(newUser);
    
    // Create default preferences
    const prefs = {
      userId: newUser.id,
      themePreset: 'classic-light' as const,
      mode: 'light' as const,
      accentColor: '#3b82f6',
      fontSize: 'normal' as const,
      alarmSound: 'default',
      alarmVolume: 80,
      alarmMuted: false,
    };
    await saveUserPreferences(prefs);
    
    await refreshUsers();
  }, [refreshUsers]);

  const editUser = useCallback(async (user: User) => {
    await updateUser(user);
    await refreshUsers();
    if (currentUser?.id === user.id) {
      setCurrentUser(user);
    }
  }, [refreshUsers, currentUser]);

  const removeUser = useCallback(async (id: string) => {
    await deleteUser(id);
    await refreshUsers();
    if (currentUser?.id === id) {
      logout();
    }
  }, [refreshUsers, currentUser, logout]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        users,
        isLoading,
        login,
        logout,
        isOwner,
        isHelper,
        refreshUsers,
        addUser,
        editUser,
        removeUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
