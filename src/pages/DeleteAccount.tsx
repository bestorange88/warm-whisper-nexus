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
import { useTranslation } from 'react-i18next';

export default function DeleteAccount() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'warning' | 'confirm' | 'done'>('warning');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const confirmWord = t('deleteAccount.confirmText');

  const handleDelete = async () => {
    if (!user || confirmText !== confirmWord) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('account_deletion_requests').insert({
        user_id: user.id,
        reason: reason || null,
      });
      if (error) throw error;
      setStep('done');
    } catch {
      alert(t('deleteAccount.submitFailed'));
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
        <PageHeader title={t('deleteAccount.title')} />
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-lg font-semibold text-stone-900">{t('deleteAccount.submitted')}</h2>
          <p className="mt-2 text-sm text-stone-500">
            {t('deleteAccount.submittedDesc', { days: ACCOUNT_DELETION_COOLING_DAYS })}
          </p>
          <Button className="mt-6" onClick={handleLogout}>{t('auth.logout')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-white">
      <PageHeader title={t('deleteAccount.title')} />
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {step === 'warning' && (
          <>
            <div className="mb-6 rounded-xl bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
                <div>
                  <h3 className="text-sm font-semibold text-red-800">{t('deleteAccount.warning')}</h3>
                  <p className="mt-1 text-sm text-red-600">{t('deleteAccount.warningDesc')}</p>
                </div>
              </div>
            </div>

            <ul className="mb-6 space-y-2 text-sm text-stone-600">
              {['dataChat', 'dataContacts', 'dataGroups', 'dataProfile', 'dataIrreversible'].map((key) => (
                <li key={key} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  {t(`deleteAccount.${key}`)}
                </li>
              ))}
            </ul>

            <div className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
              {t('deleteAccount.coolingPeriod', { days: ACCOUNT_DELETION_COOLING_DAYS })}
            </div>

            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-stone-700">{t('deleteAccount.reason')}</label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('deleteAccount.reasonPlaceholder')} rows={3} />
            </div>

            <Button variant="destructive" className="w-full" onClick={() => setStep('confirm')}>
              {t('deleteAccount.continue')}
            </Button>
          </>
        )}

        {step === 'confirm' && (
          <>
            <div className="mb-6 text-center">
              <h2 className="text-lg font-semibold text-stone-900">{t('deleteAccount.finalConfirm')}</h2>
              <p className="mt-2 text-sm text-stone-500" dangerouslySetInnerHTML={{
                __html: t('deleteAccount.confirmPrompt', { text: confirmWord })
              }} />
            </div>

            <Input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={t('deleteAccount.confirmPlaceholder')}
              className="mb-4"
            />

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setStep('warning')}>
                {t('common.back')}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDelete}
                disabled={confirmText !== confirmWord || submitting}
              >
                {submitting ? t('common.submitting') : t('deleteAccount.confirmDelete')}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
