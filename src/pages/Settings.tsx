import { useNavigate } from 'react-router-dom';
import { User, Shield, Bell, Ban, HelpCircle, FileText, Lock, Info, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserAvatar } from '@/components/avatar/UserAvatar';
import { ScrollArea } from '@/components/ui/scroll-area';

interface SettingItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  destructive?: boolean;
}

function SettingItem({ icon, label, onClick, destructive }: SettingItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-stone-50 ${destructive ? 'text-red-500' : 'text-stone-700'}`}
    >
      {icon}
      <span className="flex-1 text-sm font-medium">{label}</span>
      <span className="text-stone-300">›</span>
    </button>
  );
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <ScrollArea className="h-full">
      <div className="pb-8">
        <button
          onClick={() => navigate('/profile')}
          className="flex w-full items-center gap-3 px-4 py-4 hover:bg-stone-50"
        >
          <UserAvatar
            src={user?.user_metadata?.avatar_url}
            name={user?.user_metadata?.display_name || user?.email}
            size="lg"
          />
          <div className="min-w-0 flex-1 text-left">
            <p className="text-base font-semibold text-stone-900">
              {user?.user_metadata?.display_name || user?.user_metadata?.username || '未设置昵称'}
            </p>
            <p className="text-sm text-stone-400">{user?.email}</p>
          </div>
          <span className="text-stone-300">›</span>
        </button>

        <div className="mt-2 border-t border-stone-100">
          <div className="px-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">账号与安全</p>
          </div>
          <SettingItem icon={<User className="h-5 w-5 text-brand" />} label="个人资料" onClick={() => navigate('/profile/edit')} />
          <SettingItem icon={<Shield className="h-5 w-5 text-brand" />} label="隐私设置" onClick={() => navigate('/settings/privacy')} />
          <SettingItem icon={<Bell className="h-5 w-5 text-brand" />} label="通知设置" onClick={() => navigate('/settings/notifications')} />
          <SettingItem icon={<Ban className="h-5 w-5 text-brand" />} label="黑名单" onClick={() => navigate('/settings/blocked')} />
        </div>

        <div className="mt-2 border-t border-stone-100">
          <div className="px-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">帮助与支持</p>
          </div>
          <SettingItem icon={<HelpCircle className="h-5 w-5 text-brand" />} label="帮助中心" onClick={() => navigate('/settings/help')} />
          <SettingItem icon={<FileText className="h-5 w-5 text-brand" />} label="服务条款" onClick={() => navigate('/terms')} />
          <SettingItem icon={<Lock className="h-5 w-5 text-brand" />} label="隐私政策" onClick={() => navigate('/privacy')} />
          <SettingItem icon={<Info className="h-5 w-5 text-brand" />} label="关于我们" onClick={() => navigate('/settings/about')} />
        </div>

        <div className="mt-2 border-t border-stone-100">
          <div className="px-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-stone-400">账号管理</p>
          </div>
          <SettingItem icon={<Trash2 className="h-5 w-5 text-red-400" />} label="删除账户" onClick={() => navigate('/settings/delete-account')} destructive />
          <SettingItem icon={<LogOut className="h-5 w-5 text-red-400" />} label="退出登录" onClick={handleLogout} destructive />
        </div>
      </div>
    </ScrollArea>
  );
}
