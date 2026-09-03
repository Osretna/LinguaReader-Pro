import { useState, useEffect } from 'react';
import { realtimeSync } from '../services/realtimeService';
import { SystemState, RealtimeEvent, UserProfile } from '../types';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  timestamp: number;
}

export function useRealtime(currentUserId: string = 'user_tarek') {
  const [state, setState] = useState<SystemState>(() => realtimeSync.getState());
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    // Subscribe to state updates
    const unsubscribe = realtimeSync.subscribe((newState, event) => {
      setState(newState);

      if (event) {
        handleEventToast(event, currentUserId);
      }
    });

    // 1-second interval to update current time for live countdown timers
    const timerInterval = setInterval(() => {
      const now = Date.now();
      setCurrentTime(now);

      // Check if current user expired in trial mode
      const activeState = realtimeSync.getState();
      const currentUser = activeState.users.find((u) => u.id === currentUserId);
      if (
        currentUser &&
        currentUser.status === 'trial' &&
        currentUser.expiresAt <= now &&
        !currentUser.isBanned
      ) {
        realtimeSync.expireUserImmediately(currentUserId);
      }
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(timerInterval);
    };
  }, [currentUserId]);

  const handleEventToast = (event: RealtimeEvent, targetUserId: string) => {
    if (event.type === 'APP_LOCK_CHANGED') {
      addToast({
        id: 'toast_' + Date.now(),
        title: event.isLocked ? '🔒 تم إغلاق التطبيق' : '🔓 تم استئناف تشغيل التطبيق',
        message: event.reason || (event.isLocked ? 'تم إيقاف التطبيق من قبل الإدارة' : 'التطبيق متاح الآن للعمل'),
        type: event.isLocked ? 'error' : 'success',
        timestamp: Date.now(),
      });
    } else if (event.type === 'USER_UPDATED') {
      if (event.user.id === targetUserId) {
        addToast({
          id: 'toast_' + Date.now(),
          title: '⚡ تحديث إداري فوري',
          message: event.reason,
          type: event.user.status === 'banned' ? 'error' : 'success',
          timestamp: Date.now(),
        });
      }
    } else if (event.type === 'BROADCAST_NOTICE' && event.notice) {
      addToast({
        id: 'toast_' + Date.now(),
        title: '📢 تنبيه عام من الإدارة',
        message: event.notice,
        type: 'info',
        timestamp: Date.now(),
      });
    }
  };

  const addToast = (toast: ToastNotification) => {
    setToasts((prev) => [toast, ...prev.slice(0, 4)]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toast.id));
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const currentUser: UserProfile | undefined = state.users.find((u) => u.id === currentUserId);

  // Remaining seconds for current user
  const remainingSeconds = currentUser
    ? Math.max(0, Math.floor((currentUser.expiresAt - currentTime) / 1000))
    : 0;

  const isExpired = currentUser
    ? currentUser.status === 'expired' || (currentUser.status === 'trial' && remainingSeconds <= 0)
    : false;

  return {
    state,
    currentUser,
    currentTime,
    remainingSeconds,
    isExpired,
    toasts,
    removeToast,
    actions: {
      toggleAppLock: (isLocked: boolean, reason?: string) => realtimeSync.toggleAppLock(isLocked, reason),
      activateSubscription: (
        userId: string,
        plan: 'monthly' | 'lifetime' | 'custom' | 'trial_5m',
        durationDays: number,
        planLabel: string,
        customExpiryMs?: number,
      ) => realtimeSync.activateSubscription(userId, plan, durationDays, planLabel, customExpiryMs),
      extendTrialMinutes: (userId: string, minutes: number = 5) =>
        realtimeSync.extendTrialMinutes(userId, minutes),
      expireUserImmediately: (userId: string) => realtimeSync.expireUserImmediately(userId),
      toggleBan: (userId: string) => realtimeSync.toggleBan(userId),
      updateUserPermissions: (userId: string, permissions: Partial<UserProfile['permissions']>) =>
        realtimeSync.updateUserPermissions(userId, permissions),
      setBroadcastNotice: (notice: string | null) => realtimeSync.setBroadcastNotice(notice),
      resetToDefault: () => realtimeSync.resetToDefault(),
    },
  };
}
