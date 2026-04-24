---
name: iOS 视口与键盘适配
description: 全局视口安全区适配方案：viewport-fit、svh 高度、Capacitor Keyboard 写入 --keyboard-h
type: feature
---
项目通过 viewport-fit=cover + safe-area-inset-* + Capacitor Keyboard 插件实现 iOS 全机型自适应。

关键令牌（src/index.css）：
- --safe-top/bottom/left/right：env(safe-area-inset-*)
- --keyboard-h：键盘高度，由 src/lib/native/iosViewport.ts 监听 Capacitor Keyboard 事件写入
- --app-h：100vh → 100dvh → 100svh 渐进回退，避免 iOS 地址栏抖动

工具类：
- .pt-safe / .pb-safe（pb-safe 自动取 max(safe-bottom, keyboard-h)）
- .pl-safe / .pr-safe（横屏刘海）
- .h-app / .min-h-app（应用主容器高度）
- .h-header / .pt-header / .pb-bottom-nav

容器规范：
- 应用根容器使用 h-app（src/App.tsx）
- 顶部导航统一用 pt-safe（PageHeader / MobileLayout / ChatDetail header）
- 底部输入栏 / TabBar 使用 pb-safe

Capacitor 配置（capacitor.config.ts）：
- ios.contentInset = 'never'，scrollEnabled = false
- Keyboard.resize = 'native'，resizeOnFullScreen = true
- StatusBar.overlaysWebView = true，由 CSS 安全区接管

index.html：viewport 必须包含 viewport-fit=cover，并设置 apple-mobile-web-app-capable。
