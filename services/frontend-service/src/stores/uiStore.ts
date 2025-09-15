import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark' | 'system';
  sidebarOpen: boolean;
  mobileMenuOpen: boolean;
  readingMode: boolean;
  notifications: Notification[];
  modals: Record<string, boolean>;
  loading: Record<string, boolean>;
}

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

interface UIActions {
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setReadingMode: (enabled: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  setLoading: (key: string, loading: boolean) => void;
  clearLoading: () => void;
}

type UIStore = UIState & UIActions;

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // State
      theme: 'system',
      sidebarOpen: true,
      mobileMenuOpen: false,
      readingMode: false,
      notifications: [],
      modals: {},
      loading: {},

      // Actions
      setTheme: (theme) => set({ theme }),

      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      toggleMobileMenu: () => set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),
      setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

      setReadingMode: (enabled) => set({ readingMode: enabled }),

      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            ...notification,
            id: `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
            read: false,
          },
          ...state.notifications,
        ].slice(0, 50), // Keep only the 50 most recent notifications
      })),

      removeNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id),
      })),

      markNotificationRead: (id) => set((state) => ({
        notifications: state.notifications.map(n =>
          n.id === id ? { ...n, read: true } : n
        ),
      })),

      clearNotifications: () => set({ notifications: [] }),

      openModal: (modalId) => set((state) => ({
        modals: { ...state.modals, [modalId]: true },
      })),

      closeModal: (modalId) => set((state) => ({
        modals: { ...state.modals, [modalId]: false },
      })),

      toggleModal: (modalId) => set((state) => ({
        modals: { ...state.modals, [modalId]: !state.modals[modalId] },
      })),

      setLoading: (key, loading) => set((state) => ({
        loading: { ...state.loading, [key]: loading },
      })),

      clearLoading: () => set({ loading: {} }),
    }),
    {
      name: 'legato-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarOpen: state.sidebarOpen,
        readingMode: state.readingMode,
      }),
    }
  )
);

// Selectors
export const useTheme = () => useUIStore((state) => state.theme);
export const useSidebar = () => useUIStore((state) => ({
  isOpen: state.sidebarOpen,
  toggle: state.toggleSidebar,
  setOpen: state.setSidebarOpen,
}));
export const useMobileMenu = () => useUIStore((state) => ({
  isOpen: state.mobileMenuOpen,
  toggle: state.toggleMobileMenu,
  setOpen: state.setMobileMenuOpen,
}));
export const useNotifications = () => useUIStore((state) => ({
  notifications: state.notifications,
  unreadCount: state.notifications.filter(n => !n.read).length,
  add: state.addNotification,
  remove: state.removeNotification,
  markRead: state.markNotificationRead,
  clear: state.clearNotifications,
}));
export const useModals = () => useUIStore((state) => ({
  modals: state.modals,
  open: state.openModal,
  close: state.closeModal,
  toggle: state.toggleModal,
}));
export const useLoading = () => useUIStore((state) => ({
  loading: state.loading,
  setLoading: state.setLoading,
  clearLoading: state.clearLoading,
  isLoading: (key: string) => !!state.loading[key],
}));