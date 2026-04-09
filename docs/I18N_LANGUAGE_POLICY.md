# I18N Language Policy

## Supported Languages

| Code    | Display Name | Status   |
|---------|-------------|----------|
| `zh-CN` | 简体中文     | Default  |
| `en`    | English      | Supported|

**Only `zh-CN` and `en` are valid language codes.** Do not use `zh`, `cn`, `english`, `chinese`, or any other variants.

## Language Detection Priority

1. **User's explicit choice** — stored in `localStorage` key `i18n_language`
2. **User profile setting** — `profiles.language` column (synced after login via `syncLanguageFromProfile()`)
3. **Browser language** — detected via `navigator.language`
   - Any `zh*` variant → mapped to `zh-CN`
   - Any `en*` variant → mapped to `en`
4. **Fallback** → `zh-CN`

## Persistence

### Unauthenticated Users
- Language preference stored in `localStorage` under key `i18n_language`
- Survives page refresh and browser restart

### Authenticated Users
- On language change: immediately updates UI + `localStorage`, then async-saves to `profiles.language`
- On login: reads `profiles.language` and syncs to local state via `syncLanguageFromProfile()`
- If save to database fails: local preference still works, warning logged to console

## Language Change Flow

```
User selects language in Settings
  → i18n.changeLanguage(lng) — UI updates instantly
  → localStorage.setItem('i18n_language', lng)
  → supabase.profiles.update({ language: lng }) — async, non-blocking
```

## What Is NOT Translated

| Category              | Examples                              | Reason                    |
|-----------------------|---------------------------------------|---------------------------|
| Brand names           | 阿基米●聊, Archimi Chat              | Brand identity            |
| Usernames             | @john_doe                             | User-generated            |
| Display names         | "张三"                                | User-generated            |
| Group names           | "周末爬山群"                           | User-generated            |
| Email addresses       | support@archimi.chat                  | Technical                 |
| URLs                  | https://...                           | Technical                 |
| Version numbers       | v1.0.0                                | Technical                 |
| Error codes           | 42P01, PGRST116                       | Technical                 |
| Copyright notice      | © 2025 Archimi Chat                   | Legal, English by convention |

## Brand Name Display Strategy

- In Chinese context: **阿基米●聊**
- In English context: **Archimi Chat**
- Both names may appear together (e.g., About page shows both)
- Brand constants are defined in `src/lib/constants.ts` (`APP_NAME_ZH`, `APP_NAME_EN`)

## Date/Time Localization

- `date-fns` locale is switched based on `i18n.language`:
  - `zh-CN` → `zhCN` locale
  - `en` → `enUS` locale
- Used in conversation list for relative timestamps ("3 minutes ago" / "3 分钟前")
- Absolute time format (`HH:mm`) is language-agnostic

## Adding a New Language (Future)

1. Create `src/i18n/locales/{code}.json` with all keys
2. Add to `resources` in `src/i18n/index.ts`
3. Add to `supportedLngs` array
4. Update `convertDetectedLanguage` mapping
5. Add display option in Settings language picker
6. Update this document
