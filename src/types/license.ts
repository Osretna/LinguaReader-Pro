export interface LicenseLog {
  id: string;
  timestamp: number;
  action: 'ADD_5_MIN' | 'ADD_1_DAY' | 'ADD_CUSTOM' | 'STOP_APP' | 'RESUME_APP' | 'REDEEM_KEY' | 'RESET';
  title: string;
  details: string;
}

export interface ActivationKey {
  key: string;
  durationMinutes: number;
  label: string;
  isUsed: boolean;
  createdAt: number;
  usedAt?: number;
}

export interface LicenseConfig {
  deviceId: string;
  expiresAt: number; // timestamp in milliseconds
  isManuallyStopped: boolean;
  adminWhatsApp: string; // international format e.g. 201012345678
  adminPin: string; // PIN to open admin panel, default "1234"
  customMessage: string;
  lastCheckedTime: number; // for clock tampering check
  logs: LicenseLog[];
  keys: ActivationKey[];
}
