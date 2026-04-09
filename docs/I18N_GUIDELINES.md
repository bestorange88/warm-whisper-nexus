# I18N Development Guidelines

## Rules

1. **No hardcoded user-facing strings.** All text shown to users MUST use `t('key')` from `react-i18next`.
2. **Every new page/component** must import `useTranslation` and use translation keys.
3. **Toast messages, dialog titles, form errors, placeholders** — all must go through `t()`.
4. **Brand names** (阿基米●聊 / Archimi Chat) are NOT translated. Use constants from `src/lib/constants.ts`.
5. **User-generated content** (usernames, group names, bios) is NOT translated.

## Adding New Translations

1. Add the key to **both** `src/i18n/locales/zh-CN.json` and `src/i18n/locales/en.json`.
2. Use the module-based key naming convention:

```
{module}.{descriptiveKey}
```

Examples:
```json
"chat.newFeature": "New feature text",
"settings.darkMode": "Dark Mode",
"errors.connectionLost": "Connection lost"
```

3. Keep keys in English, descriptive, and camelCase.
4. Group related keys under the same module prefix.

## Key Naming Conventions

| Prefix          | Usage                        |
|-----------------|------------------------------|
| `common.*`      | Shared UI (confirm, cancel)  |
| `auth.*`        | Login, register, passwords   |
| `chat.*`        | Chat and conversation UI     |
| `contacts.*`    | Friends, search, blocking    |
| `group.*`       | Group management             |
| `profile.*`     | User profile                 |
| `settings.*`    | Settings page                |
| `notification.*`| Notification preferences     |
| `privacy.*`     | Privacy settings             |
| `calling.*`     | Voice/video call UI          |
| `report.*`      | Report flows                 |
| `deleteAccount.*`| Account deletion            |
| `help.*`        | Help center                  |
| `about.*`       | About page                   |
| `terms.*`       | Terms of service content     |
| `privacyPage.*` | Privacy policy content       |
| `errors.*`      | Error messages               |

## Using Translations in Components

```tsx
import { useTranslation } from 'react-i18next';

export default function MyPage() {
  const { t } = useTranslation();
  return <h1>{t('module.pageTitle')}</h1>;
}
```

## Using Translations Outside React (utilities, services)

```ts
import i18n from '@/i18n';
const t = i18n.t.bind(i18n);
const msg = t('errors.network');
```

## Interpolation

```json
"greeting": "Hello, {{name}}!"
```

```tsx
t('greeting', { name: user.displayName })
```

## Report Reasons (DB-driven)

Report reasons have `label_zh` and `label_en` columns. Select based on current language:

```tsx
const { i18n } = useTranslation();
const label = i18n.language.startsWith('zh') ? reason.label_zh : reason.label_en;
```

## Code Review Checklist

- [ ] No Chinese or English hardcoded strings in JSX
- [ ] All new keys added to both locale files
- [ ] Keys follow naming convention
- [ ] Interpolation used for dynamic values (not string concatenation)
- [ ] Brand names use constants, not translation keys
