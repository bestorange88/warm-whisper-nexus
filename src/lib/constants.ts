export const APP_NAME_EN = 'Archimi Chat';
export const APP_NAME = 'Archimi Chat';
export const APP_VERSION = '1.0.0';
export const APP_NAME_ZH = '阿基米●聊';
export const APP_TAGLINE = '安全连接，畅快沟通';
export const APP_TAGLINE_EN = 'Secure connections, seamless communication';
export const SUPPORT_EMAIL = 'support@archimi.chat';

export const COLORS = {
  primary: '#F97316',
  primaryDark: '#EA580C',
  primaryLight: '#FFF7ED',
  orange100: '#FFEDD5',
  orange200: '#FED7AA',
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
} as const;

export const MESSAGE_TYPES = {
  TEXT: 'text',
  IMAGE: 'image',
  FILE: 'file',
  AUDIO: 'audio',
  VIDEO: 'video',
  SYSTEM: 'system',
} as const;

export const MAX_FILE_SIZE = {
  IMAGE: 10 * 1024 * 1024,
  FILE: 50 * 1024 * 1024,
} as const;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

export const ACCOUNT_DELETION_COOLING_DAYS = 7;
