# iOS 权限申请计划

## 权限清单

| 权限 | 用途 | 申请时机 | Info.plist Key |
|------|------|---------|---------------|
| 麦克风 | 语音/视频通话 | 用户发起或接听通话时 | NSMicrophoneUsageDescription |
| 摄像头 | 视频通话 | 用户发起或接听视频通话时 | NSCameraUsageDescription |

## 权限文案（Info.plist）

```xml
<key>NSMicrophoneUsageDescription</key>
<string>阿基米●聊需要使用麦克风进行语音和视频通话</string>

<key>NSCameraUsageDescription</key>
<string>阿基米●聊需要使用摄像头进行视频通话和拍摄照片</string>
```

## 不申请的权限

- ❌ 定位权限
- ❌ 通讯录权限
- ❌ 后台定位
- ❌ 蓝牙
- ❌ 健康数据

## 权限申请策略

### 原则：按需申请，延迟到最后一刻

```
用户点击"语音通话"
  └─ 检查麦克风权限
      ├─ 已授权 → 继续
      ├─ 未请求 → 弹出系统权限弹窗
      │   ├─ 用户允许 → 继续
      │   └─ 用户拒绝 → 提示引导去设置
      └─ 已拒绝 → 提示引导去设置

用户点击"视频通话"
  └─ 检查麦克风权限（同上）
  └─ 检查摄像头权限（同上）
```

### 权限被拒绝时的提示

```
Dialog:
  标题：需要麦克风权限
  内容：通话功能需要麦克风权限，请在系统设置中允许阿基米●聊访问麦克风。
  按钮：[取消] [去设置]
```

### Web 端实现

```typescript
async function requestMediaPermissions(type: 'audio' | 'video'): Promise<boolean> {
  try {
    const constraints = type === 'video' 
      ? { audio: true, video: true } 
      : { audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    stream.getTracks().forEach(track => track.stop());
    return true;
  } catch (err) {
    return false;
  }
}
```

## Capacitor 适配（未来）

使用 Capacitor 打包 iOS 时：
1. 在 `ios/App/App/Info.plist` 中添加权限描述
2. 100ms SDK 的 WebRTC 在 WKWebView 中可能需要额外配置
3. 需要测试真机上的权限弹窗流程

## 未来通话推送预留

当前版本不实现通话推送通知，但架构上预留：
- `call_sessions` 表变更可触发 Database Webhook
- Webhook 调用推送 Edge Function
- 推送通知中包含 call_session_id，App 打开后自动进入来电页
