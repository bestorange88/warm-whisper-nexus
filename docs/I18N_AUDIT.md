# I18N Audit Report

## Current Status

The project uses `react-i18next` with `i18next-browser-languagedetector`. All user-facing strings have been migrated to translation JSON files.

### Supported Languages
- `zh-CN` — 简体中文 (default fallback)
- `en` — English

### Translation File Structure
```
src/i18n/index.ts          — Initialization, changeLanguage(), syncLanguageFromProfile()
src/i18n/locales/zh-CN.json — Chinese translations
src/i18n/locales/en.json    — English translations
```

### Translation Key Modules
| Module         | Key Prefix      | Description              |
|----------------|-----------------|--------------------------|
| App metadata   | `app.*`         | Brand name, version      |
| Common         | `common.*`      | Shared buttons/labels    |
| Auth           | `auth.*`        | Login, register          |
| Navigation     | `nav.*`         | Tab bar labels           |
| Chat           | `chat.*`        | Conversations, messages  |
| Contacts       | `contacts.*`    | Friends, search, block   |
| Group          | `group.*`       | Group management         |
| Profile        | `profile.*`     | User profile             |
| Settings       | `settings.*`    | Settings page            |
| Notifications  | `notification.*`| Notification settings    |
| Privacy        | `privacy.*`     | Privacy settings         |
| Calling        | `calling.*`     | Voice/video calls        |
| Report         | `report.*`      | Report user/message      |
| Delete Account | `deleteAccount.*`| Account deletion flow   |
| Help           | `help.*`        | Help center, FAQ         |
| About          | `about.*`       | About page               |
| Terms          | `terms.*`       | Terms of Service         |
| Privacy Page   | `privacyPage.*` | Privacy Policy           |
| Errors         | `errors.*`      | Error messages           |

---

## Internationalized Pages (Complete)

| Page               | File                        | Status |
|--------------------|-----------------------------|--------|
| Login              | `src/pages/Login.tsx`       | ✅     |
| Register           | `src/pages/Register.tsx`    | ✅     |
| Conversations      | `src/pages/Conversations.tsx`| ✅    |
| Chat Detail        | `src/pages/ChatDetail.tsx`  | ✅     |
| Contacts           | `src/pages/Contacts.tsx`    | ✅     |
| Friend Requests    | `src/pages/FriendRequests.tsx`| ✅   |
| Add Friend         | `src/pages/AddFriend.tsx`   | ✅     |
| Search             | `src/pages/Search.tsx`      | ✅     |
| Create Group       | `src/pages/CreateGroup.tsx` | ✅     |
| Group Detail       | `src/pages/GroupDetail.tsx`  | ✅     |
| User Profile       | `src/pages/UserProfile.tsx` | ✅     |
| Profile            | `src/pages/Profile.tsx`     | ✅     |
| Profile Edit       | `src/pages/ProfileEdit.tsx` | ✅     |
| Settings           | `src/pages/Settings.tsx`    | ✅     |
| Notification Settings | `src/pages/NotificationSettings.tsx` | ✅ |
| Privacy Settings   | `src/pages/PrivacySettings.tsx`| ✅   |
| Blocked Users      | `src/pages/BlockedUsers.tsx`| ✅     |
| Help               | `src/pages/Help.tsx`        | ✅     |
| About              | `src/pages/About.tsx`       | ✅     |
| Terms of Service   | `src/pages/Terms.tsx`       | ✅     |
| Privacy Policy     | `src/pages/Privacy.tsx`     | ✅     |
| Delete Account     | `src/pages/DeleteAccount.tsx`| ✅    |
| Report User        | `src/pages/ReportUser.tsx`  | ✅     |
| Report Message     | `src/pages/ReportMessage.tsx`| ✅    |

## Internationalized Components

| Component              | File                                          | Status |
|------------------------|-----------------------------------------------|--------|
| MobileLayout (tabs)    | `src/components/layout/MobileLayout.tsx`      | ✅     |
| ActiveCallScreen       | `src/features/calling/components/ActiveCallScreen.tsx` | ✅ |
| IncomingCallModal      | `src/features/calling/components/IncomingCallModal.tsx` | ✅ |
| CallMessageRenderer    | `src/features/calling/components/CallMessageRenderer.tsx` | ✅ |
| CallMessageBuilder     | `src/features/calling/callMessageBuilder.ts`  | ✅     |
| Global Notifications   | `src/hooks/useGlobalNotifications.ts`         | ✅     |

## Items NOT Translated (By Design)

- **Brand names**: 阿基米●聊, Archimi Chat
- **User-generated content**: usernames, display names, group names, bios
- **Technical identifiers**: UUIDs, URLs, email addresses
- **Copyright line**: `© 2025 Archimi Chat. All rights reserved.`
- **Report reason labels**: stored in DB with `label_zh` / `label_en` columns, selected by language at render time

## Known Remaining Items

- `date-fns` locale switching is implemented in `Conversations.tsx` (zhCN/enUS); other date displays use `format()` which is locale-agnostic (HH:mm)
- Future pages/components must follow the i18n pattern — see `docs/I18N_GUIDELINES.md`
