import { SystemState } from '../types';

export const INITIAL_SYSTEM_STATE: SystemState = {
  isAppLocked: false,
  lockReason: 'تم إغلاق التطبيق بواسطة الإدارة لأعمال الصيانة والتحديثات',
  broadcastNotice: null,
  users: [
    {
      id: 'user_tarek',
      name: 'tarek mohamed',
      email: 'tarek01000602170@gmail.com',
      avatar: 't',
      avatarBg: 'bg-amber-600',
      status: 'active',
      plan: 'monthly',
      planLabel: 'شهر (100 ج.م)',
      // Default to 2026-10-03 as in the user screenshot
      expiresAt: new Date(2026, 9, 3, 23, 59, 59).getTime(),
      isBanned: false,
      permissions: {
        canExportData: true,
        canUseAI: true,
        canAccessReports: true,
        canManageTeam: false,
        unlimitedStorage: false,
      },
      lastAction: 'تم تفعيل اشتراك شهر (100 ج.م)',
      lastActionTime: Date.now(),
    },
    {
      id: 'user_trial',
      name: 'مستخدم تجريبي (فترة 5 دقائق)',
      email: 'demo.user@company.com',
      avatar: 'م',
      avatarBg: 'bg-indigo-600',
      status: 'trial',
      plan: 'trial_5m',
      planLabel: 'فترة تجريبية (5 دقائق)',
      // Expires in 5 minutes from current time
      expiresAt: Date.now() + 5 * 60 * 1000,
      isBanned: false,
      permissions: {
        canExportData: false,
        canUseAI: true,
        canAccessReports: false,
        canManageTeam: false,
        unlimitedStorage: false,
      },
      lastAction: 'تم بدء الصلاحية التجريبية (5 دقائق)',
      lastActionTime: Date.now(),
    },
  ],
  auditLogs: [
    {
      id: 'log_init',
      timestamp: Date.now(),
      action: 'تهيئة نظام المزامنة اللحظية وبدء الاتصال',
      targetUser: 'النظام',
      badgeColor: 'blue',
    },
  ],
};
