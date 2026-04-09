import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Switch } from '@/components/ui/switch';

export default function NotificationSettings() {
  const [enabled, setEnabled] = useState(true);
  const [sound, setSound] = useState(true);
  const [vibrate, setVibrate] = useState(true);
  const [preview, setPreview] = useState(true);

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="通知设置" />
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-stone-100">
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-stone-700">开启通知</p>
              <p className="text-xs text-stone-400">接收新消息和来电通知</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-stone-700">通知声音</p>
              <p className="text-xs text-stone-400">收到消息时播放提示音</p>
            </div>
            <Switch checked={sound} onCheckedChange={setSound} />
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-stone-700">振动</p>
              <p className="text-xs text-stone-400">收到消息时振动提醒</p>
            </div>
            <Switch checked={vibrate} onCheckedChange={setVibrate} />
          </div>
          <div className="flex items-center justify-between px-4 py-4">
            <div>
              <p className="text-sm font-medium text-stone-700">消息预览</p>
              <p className="text-xs text-stone-400">在通知中显示消息内容</p>
            </div>
            <Switch checked={preview} onCheckedChange={setPreview} />
          </div>
        </div>
      </div>
    </div>
  );
}
