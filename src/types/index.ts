export interface Profile {
  id: string;
  email: string | null;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string;
  phone: string | null;
  status: 'online' | 'offline' | 'busy' | 'away';
  last_seen: string;
  language: string;
  role?: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

/** Public profile view — excludes sensitive PII (email, phone) */
export interface PublicProfile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string;
  status: 'online' | 'offline' | 'busy' | 'away';
  last_seen: string;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  avatar_url: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  last_message?: Message;
  unread_count?: number;
  is_pinned?: boolean;
  members?: ConversationMember[];
  other_user?: Profile;
}

export interface ConversationMember {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
  last_read_at: string;
  is_muted: boolean;
  muted_until: string | null;
  profile?: Profile;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system';
  content: string | null;
  media_url: string | null;
  file_name: string | null;
  file_size: number | null;
  reply_to: string | null;
  is_edited: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  sender?: Profile;
}

export interface Friendship {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
  friend?: Profile;
}

export interface FriendRequest {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string | null;
  created_at: string;
  updated_at: string;
  sender?: Profile;
  receiver?: Profile;
}

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  reason: string | null;
  created_at: string;
  blocked_user?: Profile;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  reported_message_id: string | null;
  type: 'user' | 'message';
  reason_id: string | null;
  description: string | null;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  admin_notes: string | null;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportReason {
  id: string;
  key: string;
  label_zh: string;
  label_en: string;
  is_active: boolean;
  sort_order: number;
}

export interface GroupRoom {
  id: string;
  conversation_id: string;
  description: string | null;
  max_members: number;
  is_public: boolean;
  invite_link: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  notification_enabled: boolean;
  notification_sound: boolean;
  notification_vibrate: boolean;
  message_preview: boolean;
  online_status_visible: boolean;
  last_seen_visible: boolean;
  read_receipts: boolean;
  language: string;
  theme: 'light' | 'dark' | 'system';
  font_size: 'small' | 'medium' | 'large';
  created_at: string;
  updated_at: string;
}

export interface AccountDeletionRequest {
  id: string;
  user_id: string;
  reason: string | null;
  status: 'pending' | 'cancelled' | 'completed';
  requested_at: string;
  cooling_ends_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
}

export interface SystemAnnouncement {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  published_by: string | null;
  published_at: string;
  expires_at: string | null;
}
