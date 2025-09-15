import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { UserPreferences } from '@/lib/api/types';

interface PreferencesState {
  preferences: UserPreferences | null;
  localPreferences: Partial<UserPreferences>;
  syncStatus: 'idle' | 'syncing' | 'error';
  lastSync: number;
}

interface PreferencesActions {
  setPreferences: (preferences: UserPreferences) => void;
  updateLocalPreferences: (updates: Partial<UserPreferences>) => void;
  syncPreferences: () => Promise<void>;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
  mergePreferences: (serverPreferences: UserPreferences) => UserPreferences;
}

type PreferencesStore = PreferencesState & PreferencesActions;

const defaultPreferences: Partial<UserPreferences> = {
  language: 'en',
  genres: [],
  notifications: {
    email: true,
    push: true,
    newChapters: true,
    comments: true,
    followers: true,
  },
  privacy: {
    profileVisible: true,
    readingHistoryVisible: false,
    followersVisible: true,
  },
  reading: {
    fontSize: 16,
    fontFamily: 'Inter',
    theme: 'light',
    lineHeight: 1.6,
    margin: 20,
    autoScroll: false,
  },
};

export const usePreferencesStore = create<PreferencesStore>()(
  persist(
    (set, get) => ({
      // State
      preferences: null,
      localPreferences: defaultPreferences,
      syncStatus: 'idle',
      lastSync: 0,

      // Actions
      setPreferences: (preferences) => set({
        preferences,
        lastSync: Date.now(),
      }),

      updateLocalPreferences: (updates) => set((state) => ({
        localPreferences: {
          ...state.localPreferences,
          ...updates,
        },
      })),

      syncPreferences: async () => {
        const state = get();
        set({ syncStatus: 'syncing' });

        try {
          // In a real app, this would sync with the server
          // For now, we'll simulate the sync
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Merge local changes with server preferences
          const mergedPreferences = state.mergePreferences(
            state.preferences || defaultPreferences as UserPreferences
          );

          set({
            preferences: mergedPreferences,
            localPreferences: {},
            syncStatus: 'idle',
            lastSync: Date.now(),
          });
        } catch (error) {
          console.error('Failed to sync preferences:', error);
          set({ syncStatus: 'error' });
        }
      },

      setSyncStatus: (status) => set({ syncStatus: status }),

      mergePreferences: (serverPreferences) => {
        const state = get();
        
        // Merge local preferences with server preferences
        // Local preferences take precedence for user-specific settings
        return {
          ...serverPreferences,
          ...state.localPreferences,
          notifications: {
            ...serverPreferences.notifications,
            ...state.localPreferences.notifications,
          },
          privacy: {
            ...serverPreferences.privacy,
            ...state.localPreferences.privacy,
          },
          reading: {
            ...serverPreferences.reading,
            ...state.localPreferences.reading,
          },
        };
      },
    }),
    {
      name: 'legato-preferences',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        localPreferences: state.localPreferences,
        lastSync: state.lastSync,
      }),
    }
  )
);

// Selectors
export const useUserPreferences = () => usePreferencesStore((state) => {
  const mergedPreferences = state.preferences 
    ? state.mergePreferences(state.preferences)
    : { ...defaultPreferences, ...state.localPreferences };

  return {
    preferences: mergedPreferences,
    updatePreferences: state.updateLocalPreferences,
    syncPreferences: state.syncPreferences,
    syncStatus: state.syncStatus,
    lastSync: state.lastSync,
  };
});

export const useNotificationPreferences = () => usePreferencesStore((state) => {
  const preferences = state.preferences 
    ? state.mergePreferences(state.preferences)
    : { ...defaultPreferences, ...state.localPreferences };

  return {
    notifications: preferences.notifications || defaultPreferences.notifications!,
    updateNotifications: (updates: Partial<UserPreferences['notifications']>) =>
      state.updateLocalPreferences({ 
        notifications: { 
          ...defaultPreferences.notifications,
          ...preferences.notifications, 
          ...updates 
        } as UserPreferences['notifications']
      }),
  };
});

export const usePrivacyPreferences = () => usePreferencesStore((state) => {
  const preferences = state.preferences 
    ? state.mergePreferences(state.preferences)
    : { ...defaultPreferences, ...state.localPreferences };

  return {
    privacy: preferences.privacy || defaultPreferences.privacy!,
    updatePrivacy: (updates: Partial<UserPreferences['privacy']>) =>
      state.updateLocalPreferences({ 
        privacy: { 
          ...defaultPreferences.privacy,
          ...preferences.privacy, 
          ...updates 
        } as UserPreferences['privacy']
      }),
  };
});