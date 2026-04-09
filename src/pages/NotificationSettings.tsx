import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Switch } from '@/components/ui/switch';
import { MessageSquare, Phone, Users, Volume2 } from 'lucide-react';

interface SettingRowProps {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}

function SettingRow({ label, description, checked, onCheckedChange }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between px-4 py-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}

function Section({ icon, title, children }: SectionProps) {
  return (
    <div className="mt-2 border-t border-border">
      <div className="flex items-center gap-2 px-4 py-3">
        {icon}
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  );
}

export default function NotificationSettings() {
  // 新消息
  const [msgEnabled, setMsgEnabled] = useState(true);
  const [msgSound, setMsgSound] = useState(true);
  const [msgPreview, setMsgPreview] = useState(true);

  // 通话
  const [callEnabled, setCallEnabled] = useState(true);
  const [callVibrate, setCallVibrate] = useState(true);

  // 好友与群组
  const [friendReq, setFriendReq] = useState(true);
  const [groupInvite, setGroupInvite] = useState(true);

  return (
    <div className="flex h-full flex-col bg-background">
      <PageHeader title="通知设置" />
      <div className="flex-1 overflow-y-auto pb-8">
        <Section
          icon={<MessageSquare className="h-4 w-4 text-primary" />}
          title="新消息提醒"
        >
          <SettingRow
            label="新消息通知"
            description="收到新消息时提醒"
            checked={msgEnabled}
            onCheckedChange={setMsgEnabled}
          />
          <SettingRow
            label="通知声音"
            description="收到消息时播放提示音"
            checked={msgSound}
            onCheckedChange={setMsgSound}
          />
          <SettingRow
            label="消息预览"
            description="在通知中显示消息内容"
            checked={msgPreview}
            onCheckedChange={setMsgPreview}
          />
        </Section>

        <Section
          icon={<Phone className="h-4 w-4 text-primary" />}
          title="通话提醒"
        >
          <SettingRow
            label="来电通知"
            description="有来电时弹出提醒"
            checked={callEnabled}
            onCheckedChange={setCallEnabled}
          />
          <SettingRow
            label="来电振动"
            description="来电时振动提醒"
            checked={callVibrate}
            onCheckedChange={setCallVibrate}
          />
        </Section>

        <Section
          icon={<Users className="h-4 w-4 text-primary" />}
          title="好友与群组"
        >
          <SettingRow
            label="好友请求"
            description="收到好友申请时提醒"
            checked={friendReq}
            onCheckedChange={setFriendReq}
          />
          <SettingRow
            label="群组邀请"
            description="被邀请加入群聊时提醒"
            checked={groupInvite}
            onCheckedChange={setGroupInvite}
          />
        </Section>

        <div className="mt-6 px-4">
          <div className="flex items-start gap-2 rounded-lg bg-muted p-3">
            <Volume2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              当前版本的通知仅在应用内生效。系统级推送通知将在后续版本中支持。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
