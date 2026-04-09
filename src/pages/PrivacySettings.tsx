import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Switch } from '@/components/ui/switch';

export default function PrivacySettings() {
  const [onlineVisible, setOnlineVisible] = useState(true);
  const [lastSeenVisible, setLastSeenVisible] = useState(true);
  const [readReceipts, setReadReceipts] = useState(true);

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="隐私设置" />
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-stone-100">
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-stone-700">显示在线状态</p>
              <p className="text-xs text-stone-400">允许其他用户看到你的在线状态</p>
            </div>
            <Switch checked={onlineVisible} onCheckedChange={setOnlineVisible} />
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-stone-700">显示最后上线时间</p>
              <p className="text-xs text-stone-400">允许其他用户看到你的最后上线时间</p>
            </div>
            <Switch checked={lastSeenVisible} onCheckedChange={setLastSeenVisible} />
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-stone-700">已读回执</p>
              <p className="text-xs text-stone-400">让发送者知道你已读取消息</p>
            </div>
            <Switch checked={readReceipts} onCheckedChange={setReadReceipts} />
          </div>
        </div>
      </div>
    </div>
  );
}
