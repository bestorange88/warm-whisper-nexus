import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useReportReasons, useSubmitReport } from '@/hooks/useReport';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';

export default function ReportMessage() {
  const { messageId } = useParams<{ messageId: string }>();
  const { user } = useAuth();
  const { data: reasons, isLoading } = useReportReasons();
  const submitReport = useSubmitReport();
  const navigate = useNavigate();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user || !messageId || !selectedReason) return;
    setSubmitting(true);
    try {
      await submitReport.mutateAsync({
        reporter_id: user.id,
        reported_user_id: null,
        reported_message_id: messageId,
        type: 'message',
        reason_id: selectedReason,
        description: description || null,
      });
      setSubmitted(true);
    } catch {
      // handled
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) return <FullPageLoading />;

  if (submitted) {
    return (
      <div className="flex h-full flex-col bg-white">
        <PageHeader title="举报消息" />
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <span className="text-2xl">✓</span>
          </div>
          <h2 className="text-lg font-semibold text-stone-900">举报已提交</h2>
          <p className="mt-2 text-sm text-stone-500">感谢您的反馈，我们会尽快处理。</p>
          <Button className="mt-6" onClick={() => navigate(-1)}>返回</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title="举报消息" />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-4 text-sm text-stone-500">请选择举报原因：</p>
        <div className="space-y-2">
          {reasons?.map((r) => (
            <button
              key={r.id}
              onClick={() => setSelectedReason(r.id)}
              className={cn(
                "w-full rounded-lg border px-4 py-3 text-left text-sm transition-colors",
                selectedReason === r.id
                  ? "border-brand bg-brand-light text-brand-dark"
                  : "border-stone-200 text-stone-700 hover:bg-stone-50"
              )}
            >
              {r.label_zh}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-stone-700">补充说明（可选）</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="请描述具体情况..." rows={3} />
        </div>
        <Button className="mt-6 w-full" onClick={handleSubmit} disabled={!selectedReason || submitting}>
          {submitting ? '提交中...' : '提交举报'}
        </Button>
      </div>
    </div>
  );
}
