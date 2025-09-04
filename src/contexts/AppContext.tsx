import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { StorageService } from '../utils/storage';
import { Scene, Avatar, apiService } from '../services/api';
import { socketService } from '../services/socketService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ScenesState {
  [avatarUrl: string]: {
    scenes: Scene[];
    totalGenerated: number;
    isLoading: boolean;
    hasGenerated: boolean;
  };
}

interface AvatarsState {
  [prompt: string]: {
    avatars: Avatar[];
    totalGenerated: number;
    totalRequested: number;
    isLoading: boolean;
    hasGenerated: boolean;
  };
}

interface User {
  id: string;
  email: string;
  accessToken: string;
}

interface AppContextType {
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  user: User | null;
  scenesState: ScenesState;
  avatarsState: AvatarsState;
  publicAvatars: Avatar[];
  completeOnboarding: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  generateScenesForAvatar: (avatarUrl: string) => Promise<void>;
  getScenesForAvatar: (avatarUrl: string) => { scenes: Scene[]; totalGenerated: number; isLoading: boolean; hasGenerated: boolean };
  generateAvatarsForPrompt: (prompt: string) => Promise<void>;
  getAvatarsForPrompt: (prompt: string) => { avatars: Avatar[]; totalGenerated: number; totalRequested: number; isLoading: boolean; hasGenerated: boolean };
  loadPublicAvatars: () => Promise<void>;
  getPublicAvatarScenes: (avatarId: number) => Promise<Scene[]>;
  saveSelectedAvatarWithScenes: (avatar: Avatar, scenes: Scene[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [scenesState, setScenesState] = useState<ScenesState>({});
  const [avatarsState, setAvatarsState] = useState<AvatarsState>({});
  const [publicAvatars, setPublicAvatars] = useState<Avatar[]>([]);

  const checkAppState = async () => {
    try {
      const [onboardingComplete, storedUser] = await Promise.all([
        StorageService.hasCompletedOnboarding(),
        AsyncStorage.getItem('user')
      ]);

      setHasCompletedOnboarding(onboardingComplete);
      
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        
        socketService.connect();
      }
    } catch (error) {
      console.error('Error checking app state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    await StorageService.setOnboardingCompleted(true);
    setHasCompletedOnboarding(true);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await apiService.signIn(email, password);
      
      if (response.success && response.user && response.session) {
        const userData: User = {
          id: response.user.id,
          email: response.user.email,
          accessToken: response.session.access_token
        };
        
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: response.session.access_token,
          refresh_token: response.session.refresh_token
        }));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        socketService.connect();
      } else {
        throw new Error(response.message || 'Sign in failed');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const response = await apiService.signUp(email, password);
      
      if (response.success && response.user && response.session) {
        const userData: User = {
          id: response.user.id,
          email: response.user.email,
          accessToken: response.session.access_token
        };
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('supabase.auth.token', JSON.stringify({
          access_token: response.session.access_token,
          refresh_token: response.session.refresh_token
        }));
        
        setUser(userData);
        setIsAuthenticated(true);
        
        socketService.connect();
      } else {
        throw new Error(response.message || 'Sign up failed');
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await apiService.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      await AsyncStorage.multiRemove(['user', 'supabase.auth.token']);
      setUser(null);
      setIsAuthenticated(false);
      
      socketService.disconnect();
      
      setScenesState({});
      setAvatarsState({});
    }
  };

  useEffect(() => {
    checkAppState();
  }, []);

  const generateScenesForAvatar = async (avatarUrl: string) => {
    if (scenesState[avatarUrl]?.hasGenerated || scenesState[avatarUrl]?.isLoading) {
      return;
    }

    setScenesState(prev => ({
      ...prev,
      [avatarUrl]: {
        scenes: [],
        totalGenerated: 0,
        isLoading: true,
        hasGenerated: false,
      }
    }));

    try {
      const data = await apiService.createScenes(avatarUrl);
      
      if (data.success) {
        setScenesState(prev => ({
          ...prev,
          [avatarUrl]: {
            scenes: data.scenes,
            totalGenerated: data.totalGenerated,
            isLoading: false,
            hasGenerated: true,
          }
        }));
        console.log('Scenes generated:', data.scenes);
        
      } else {
        throw new Error('Failed to generate scenes');
      }
    } catch (error) {
      console.error('Error generating scenes:', error);
      setScenesState(prev => ({
        ...prev,
        [avatarUrl]: {
          scenes: [],
          totalGenerated: 0,
          isLoading: false,
          hasGenerated: false,
        }
      }));
      throw error;
    }
  };

  const getScenesForAvatar = (avatarUrl: string) => {
    return scenesState[avatarUrl] || {
      scenes: [],
      totalGenerated: 0,
      isLoading: false,
      hasGenerated: false
    };
  };

  const generateAvatarsForPrompt = async (prompt: string) => {
    const trimmedPrompt = prompt.trim();
    
    if (avatarsState[trimmedPrompt]?.hasGenerated || avatarsState[trimmedPrompt]?.isLoading) {
      return;
    }

    setAvatarsState(prev => ({
      ...prev,
      [trimmedPrompt]: {
        avatars: [],
        totalGenerated: 0,
        totalRequested: 0,
        isLoading: true,
        hasGenerated: false
      }
    }));

    try {
      const data = await apiService.createAvatar(trimmedPrompt);
      
      if (data.success) {
        setAvatarsState(prev => ({
          ...prev,
          [trimmedPrompt]: {
            avatars: data.avatars || [],
            totalGenerated: data.totalGenerated || 0,
            totalRequested: data.totalRequested || 0,
            isLoading: false,
            hasGenerated: true
          }
        }));
      } else {
        throw new Error('Failed to create avatar images');
      }
    } catch (error) {
      console.error('Error generating avatars:', error);
      setAvatarsState(prev => ({
        ...prev,
        [trimmedPrompt]: {
          avatars: [],
          totalGenerated: 0,
          totalRequested: 0,
          isLoading: false,
          hasGenerated: false
        }
      }));
      throw error;
    }
  };

  const getAvatarsForPrompt = (prompt: string) => {
    const trimmedPrompt = prompt.trim();
    return avatarsState[trimmedPrompt] || {
      avatars: [],
      totalGenerated: 0,
      totalRequested: 0,
      isLoading: false,
      hasGenerated: false
    };
  };

  const loadPublicAvatars = async () => {
    try {
      const response = await apiService.getPublicAvatars();
      if (response.success) {
        setPublicAvatars(response.avatars);
      }
    } catch (error) {
      console.error('Error loading public avatars:', error);
    }
  };

  const getPublicAvatarScenes = async (avatarId: number): Promise<Scene[]> => {
    try {
      const response = await apiService.getAvatarScenes(avatarId);
      if (response.success) {
        return response.scenes;
      }
      return [];
    } catch (error) {
      console.error('Error getting public avatar scenes:', error);
      return [];
    }
  };

  const saveSelectedAvatarWithScenes = async (avatar: Avatar, scenes: Scene[]) => {
    try {
      await apiService.saveAvatarWithScenes(avatar, scenes);
    } catch (error) {
      console.error('Error saving avatar with scenes:', error);
      throw error;
    }
  };


  const value: AppContextType = {
    isLoading,
    hasCompletedOnboarding,
    isAuthenticated,
    user,
    scenesState,
    avatarsState,
    publicAvatars,
    completeOnboarding,
    signIn,
    signUp,
    logout,
    generateScenesForAvatar,
    getScenesForAvatar,
    generateAvatarsForPrompt,
    getAvatarsForPrompt,
    loadPublicAvatars,
    getPublicAvatarScenes,
    saveSelectedAvatarWithScenes,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};