import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle } from 'lucide-react';
import { ACCOUNT_DELETION_COOLING_DAYS } from '@/lib/constants';

export default function DeleteAccount() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'warning' | 'confirm' | 'done'>('warning');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleDelete = async () => {
    if (!user || confirmText !== '删除账户') return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('account_deletion_requests').insert({
        user_id: user.id,
        reason: reason || null,
      });
      if (error) throw error;
      setStep('done');
    } catch {
      alert('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  if (step === 'done') {
    return (
      <div className="flex h-full flex-col bg-white">
        <PageHeader title="删除账户" />
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-stone-900">删除请求已提交</h2>
          <p className="mt-2 text-sm text-stone-500">
            您的账户将在 {ACCOUNT_DELETION_COOLING_DAYS} 天后被永久删除。
            在此期间，您可以登录并取消删除请求。
          </p>
          <Button className="mt-6" onClick={handleLogout}>退出登录</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="删除账户" />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {step === 'warning' && (
          <>
            <div className="mb-6 rounded-xl bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div>
                  <h3 className="text-sm font-semibold text-red-800">警告：此操作不可撤销</h3>
                  <p className="mt-1 text-sm text-red-600">
                    删除账户后，以下数据将被永久清除：
                  </p>
                </div>
              </div>
            </div>

            <ul className="mb-6 space-y-2 text-sm text-stone-600">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                所有聊天记录将被永久删除
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                所有联系人关系将被移除
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                所有群组成员资格将被终止
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                您的个人资料将被永久清除
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                此操作无法撤销
              </li>
            </ul>

            <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              提交删除请求后，有 {ACCOUNT_DELETION_COOLING_DAYS} 天的冷却期。在此期间您可以取消请求。
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-stone-700">删除原因（可选）</label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="告诉我们您离开的原因..." rows={3} />
            </div>

            <Button variant="destructive" className="w-full" onClick={() => setStep('confirm')}>
              继续删除
            </Button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-lg font-semibold text-stone-900">最终确认</h2>
              <p className="mt-2 text-sm text-stone-500">
                请输入 <span className="font-semibold text-red-500">"删除账户"</span> 以确认
              </p>
            </div>

            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="请输入 '删除账户'"
              className="mb-4"
            />

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('warning')}>
                返回
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={confirmText !== '删除账户' || submitting}
              >
                {submitting ? '提交中...' : '确认删除'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
