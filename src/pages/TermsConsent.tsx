import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldAlert, Clock3, Flag, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';

const TERMS_VERSION = '2026-04-15';

export default function TermsConsent() {
  const { t } = useTranslation();
  const { acceptTerms } = useAuth();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!checked) {
      setError(t('termsConsent.required'));
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const { error: updateError } = await acceptTerms(TERMS_VERSION);
      if (updateError) {
        setError(t('termsConsent.updateFailed'));
        return;
      }
      navigate('/conversations', { replace: true });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="safe-area-top safe-area-bottom flex h-full flex-col overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-4 py-6">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-card-foreground">{t('termsConsent.title')}</h1>
              <p className="mt-1 text-sm text-muted-foreground">{t('termsConsent.headline')}</p>
            </div>
          </div>

          <p className="text-sm leading-6 text-muted-foreground">{t('termsConsent.description')}</p>

          <div className="mt-5 space-y-3">
            {[
              { icon: Flag, text: t('termsConsent.rule1') },
              { icon: ShieldAlert, text: t('termsConsent.rule2') },
              { icon: Ban, text: t('termsConsent.rule3') },
              { icon: Clock3, text: t('termsConsent.rule4') },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex gap-3 rounded-xl bg-muted/60 px-4 py-3">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm leading-6 text-foreground">{item.text}</p>
                </div>
              );
            })}
          </div>

          <label className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-secondary px-4 py-4 text-sm text-foreground">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-current"
            />
            <span>{t('termsConsent.checkbox')}</span>
          </label>

          {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Link to="/terms">
              <Button type="button" variant="outline" className="w-full text-xs">{t('termsConsent.viewTerms')}</Button>
            </Link>
            <Link to="/privacy">
              <Button type="button" variant="outline" className="w-full text-xs">{t('termsConsent.viewPrivacy')}</Button>
            </Link>
          </div>

          <Button type="button" className="mt-4 w-full" onClick={handleContinue} disabled={submitting}>
            {submitting ? t('termsConsent.continueLoading') : t('termsConsent.continue')}
          </Button>
        </div>
      </div>
    </div>
  );
}