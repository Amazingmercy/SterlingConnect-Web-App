import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { api } from '../services/api';

export interface NotificationItem {
  id: string;
  type: 'deadline' | 'result' | 'followup' | 'system';
  title: string;
  message: string;
  date: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

const getUserNotifKey = (userId?: string) =>
  userId ? `sterling_connect_notifications_${userId}` : 'sterling_connect_notifications_guest';

const LEGACY_STORAGE_KEY = 'sterling_connect_notifications_v1';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  clearNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const mapBackendNotif = (n: any): NotificationItem => {
  let mappedType: NotificationItem['type'] = 'system';
  if (n.type === 'DEADLINE_REMINDER') mappedType = 'deadline';
  else if (n.type === 'ASSESSMENT_RESULT') mappedType = 'result';
  else if (n.type === 'STATUS_UPDATE') mappedType = 'followup';

  return {
    id: n.id,
    type: mappedType,
    title: n.title,
    message: n.message,
    date: n.createdAt,
    read: n.isRead,
    actionUrl: n.actionUrl || undefined,
    actionLabel: n.actionUrl ? 'View Details' : undefined,
  };
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  // Clean legacy unscoped notifications on startup
  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const notifKey = getUserNotifKey(user.id);

    // Initial local read for this specific user
    try {
      const stored = localStorage.getItem(notifKey);
      if (stored) {
        setNotifications(JSON.parse(stored));
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    }

    try {
      const res = await api.get('/notifications');
      if (res.data?.notifications) {
        const mapped = res.data.notifications.map(mapBackendNotif);
        setNotifications(mapped);
        localStorage.setItem(notifKey, JSON.stringify(mapped));
      }
    } catch {
      // Keep cached notifications on offline
    }
  }, [user]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Real-time synchronization: poll every 30s, refresh on focus, and listen for custom refresh events
  useEffect(() => {
    if (!user) return;

    const handleFocus = () => {
      fetchNotifications();
    };

    const handleCustomRefresh = () => {
      fetchNotifications();
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('refresh-notifications', handleCustomRefresh);
    const interval = setInterval(fetchNotifications, 30000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('refresh-notifications', handleCustomRefresh);
      clearInterval(interval);
    };
  }, [fetchNotifications, user]);

  useEffect(() => {
    if (!user) return;
    try {
      const notifKey = getUserNotifKey(user.id);
      localStorage.setItem(notifKey, JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to persist notifications:', e);
    }
  }, [notifications, user]);

  const markAsRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );

    if (user) {
      try {
        await api.patch(`/notifications/${id}/read`);
      } catch {}
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    if (user) {
      try {
        await api.patch('/notifications/read-all');
      } catch {}
    }
  };

  const clearNotification = async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    if (user) {
      try {
        await api.delete(`/notifications/${id}`);
      } catch {}
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
        refreshNotifications: fetchNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return ctx;
};
