import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { StorageService } from '../utils/storage';

interface AppContextType {
  isLoading: boolean;
  hasCompletedOnboarding: boolean;
  isAuthenticated: boolean;
  completeOnboarding: () => Promise<void>;
  authenticate: () => Promise<void>;
  logout: () => Promise<void>;
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

  const value: AppContextType = {
    isLoading,
    hasCompletedOnboarding,
    isAuthenticated,
    completeOnboarding,
    authenticate,
    logout,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};