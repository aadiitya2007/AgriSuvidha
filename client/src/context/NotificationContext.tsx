import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { NotificationItem } from '../types';
import { apiRequest } from '../services/api';
import { useAuth } from './AuthContext';
import { playNotificationSound, playSuccessSound, playCalloutSound } from '../utils/sound';

export interface ToastItem {
  id: string;
  title: string;
  body: string;
  category: string;
  actionUrl?: string;
  durationMs?: number;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'> & { id?: string }) => void;
  dismissToast: (id: string) => void;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const seenNotificationIds = useRef<Set<string>>(new Set());
  const hasInitialFetched = useRef<boolean>(false);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, 'id'> & { id?: string }) => {
    const toastId = toast.id || `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newToast: ToastItem = {
      ...toast,
      id: toastId,
    };

    // Play appropriate audio cue
    if (toast.category === 'PAYMENT') {
      playSuccessSound();
    } else if (toast.category === 'QUEUE') {
      playCalloutSound();
    } else {
      playNotificationSound();
    }

    setToasts((prev) => {
      // Don't add duplicate if already showing
      if (prev.some((t) => t.id === toastId)) return prev;
      // Keep up to 3 toasts at a time on screen
      return [newToast, ...prev.slice(0, 2)];
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await apiRequest('/notifications');
      const items: NotificationItem[] = data.notifications || [];
      const newUnreadCount = data.unreadCount || 0;

      // First load: seed seen IDs so we don't alert old history
      if (!hasInitialFetched.current) {
        items.forEach((item) => seenNotificationIds.current.add(item.id));
        hasInitialFetched.current = true;
      } else {
        // Subsequent poll: detect new unread notifications
        items.forEach((item) => {
          if (!item.isRead && !seenNotificationIds.current.has(item.id)) {
            seenNotificationIds.current.add(item.id);
            showToast({
              id: item.id,
              title: item.title,
              body: item.body,
              category: item.category,
              actionUrl: item.actionUrl,
            });
          }
        });
      }

      setNotifications(items);
      setUnreadCount(newUnreadCount);
    } catch (err) {
      // Ignore background notification fetch errors
    }
  }, [user, showToast]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000); // 10s polling for snappy response
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
      setToasts([]);
      seenNotificationIds.current.clear();
      hasInitialFetched.current = false;
    }
  }, [user, fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await apiRequest(`/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiRequest('/notifications/all/read', { method: 'PATCH' });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        showToast,
        dismissToast,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
};
