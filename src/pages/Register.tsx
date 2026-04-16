import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

import { useTranslation } from 'react-i18next';
import logoImage from '@/assets/logo.png';
import { containsObjectionableContent } from '@/lib/moderation';

const TERMS_VERSION = '2026-04-15';

export default function Register() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError(t('auth.passwordMismatch')); return; }
    if (password.length < 6) { setError(t('auth.passwordTooShort')); return; }
    if (username.length < 2) { setError(t('auth.usernameTooShort')); return; }
    if (!acceptedTerms) { setError(t('auth.acceptRequired')); return; }
    if (containsObjectionableContent(username)) { setError(t('auth.usernameBlocked')); setLoading(false); return; }

    setLoading(true);
    try {
      const { error: signUpError } = await signUp(email, password, username);
      if (signUpError) { setError(signUpError.message); } else { navigate('/'); }
    } catch {
      setError(t('auth.registerFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="safe-area-top safe-area-bottom flex h-full flex-col overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-8">
        <div className="mb-8 flex flex-col items-center">
          <img src={logoImage} alt={t('app.name')} className="mb-4 h-16 w-16 rounded-2xl shadow-lg" />
          <h1 className="text-xl font-bold text-stone-900">{t('auth.registerTitle', { appName: t('app.name') })}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">{t('auth.username')}</label>
            <Input type="text" placeholder={t('auth.usernamePlaceholder')} value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">{t('auth.email')}</label>
            <Input type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">{t('auth.password')}</label>
            <Input type="password" placeholder={t('auth.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">{t('auth.confirmPassword')}</label>
            <Input type="password" placeholder={t('auth.confirmPasswordPlaceholder')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <label className="flex items-start gap-3 rounded-lg border border-stone-200 bg-stone-50 px-3 py-3 text-sm text-stone-600">
            <input
              type="checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-current"
            />
            <span>
              {t('auth.iAgreeTo')}
              <Link to="/terms" className="text-brand"> {t('auth.termsOfService')} </Link>
              {t('auth.and')}
              <Link to="/privacy" className="text-brand"> {t('auth.privacyPolicy')} </Link>
              {t('auth.zeroToleranceNotice')}
            </span>
          </label>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('auth.registering') : t('auth.register')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-stone-400">{t('auth.hasAccount')}</span>
          <Link to="/login" className="ml-1 text-brand hover:text-brand-dark">{t('auth.loginNow')}</Link>
        </div>

      </div>
    </div>
  );
}
