import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { StorageService } from '../utils/storage';
import { Scene, Avatar, apiService } from '../services/api';

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

interface AppContextType {
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  scenesState: ScenesState;
  avatarsState: AvatarsState;
  completeOnboarding: () => Promise<void>;
  authenticate: () => Promise<void>;
  logout: () => Promise<void>;
  generateScenesForAvatar: (avatarUrl: string) => Promise<void>;
  getScenesForAvatar: (avatarUrl: string) => { scenes: Scene[]; totalGenerated: number; isLoading: boolean; hasGenerated: boolean };
  generateAvatarsForPrompt: (prompt: string) => Promise<void>;
  getAvatarsForPrompt: (prompt: string) => { avatars: Avatar[]; totalGenerated: number; totalRequested: number; isLoading: boolean; hasGenerated: boolean };
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
  const [scenesState, setScenesState] = useState<ScenesState>({});
  const [avatarsState, setAvatarsState] = useState<AvatarsState>({});

  const checkAppState = async () => {
    try {
      const [onboardingComplete, authenticated] = await Promise.all([
        StorageService.hasCompletedOnboarding(),
        StorageService.isAuthenticated(),
      ]);

      setHasCompletedOnboarding(onboardingComplete);
      setIsAuthenticated(authenticated);
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

  const authenticate = async () => {
    await StorageService.setAuthenticated(true);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    await StorageService.setAuthenticated(false);
    setIsAuthenticated(false);
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
        hasGenerated: false
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
            hasGenerated: true
          }
        }));
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
          hasGenerated: false
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

  const value: AppContextType = {
    isLoading,
    hasCompletedOnboarding,
    isAuthenticated,
    scenesState,
    avatarsState,
    completeOnboarding,
    authenticate,
    logout,
    generateScenesForAvatar,
    getScenesForAvatar,
    generateAvatarsForPrompt,
    getAvatarsForPrompt,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};