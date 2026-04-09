import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useReportReasons, useSubmitReport } from '@/hooks/useReport';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { FullPageLoading } from '@/components/common/LoadingSpinner';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

export default function ReportUser() {
  const { t, i18n } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const { data: reasons, isLoading } = useReportReasons();
  const submitReport = useSubmitReport();
  const navigate = useNavigate();
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user || !userId || !selectedReason) return;
    setSubmitting(true);
    try {
      await submitReport.mutateAsync({
        reporter_id: user.id,
        reported_user_id: userId,
        reported_message_id: null,
        type: 'user',
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
        <PageHeader title={t('report.reportUser')} />
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <span className="text-2xl">✓</span>
          </div>
          <h2 className="text-lg font-semibold text-stone-900">{t('report.reported')}</h2>
          <p className="mt-2 text-sm text-stone-500">{t('report.reportedDesc')}</p>
          <Button className="mt-6" onClick={() => navigate(-1)}>{t('common.back')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('report.reportUser')} />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <p className="mb-4 text-sm text-stone-500">{t('report.selectReason')}</p>
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
              {i18n.language.startsWith('zh') ? r.label_zh : r.label_en}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <label className="mb-1.5 block text-sm font-medium text-stone-700">{t('report.description')}</label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t('report.descriptionPlaceholder')} rows={3} />
        </div>
        <Button className="mt-6 w-full" onClick={handleSubmit} disabled={!selectedReason || submitting}>
          {submitting ? t('common.submitting') : t('report.submitReport')}
        </Button>
      </div>
    </div>
  );
}
