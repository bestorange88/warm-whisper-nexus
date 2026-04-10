import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

import { useTranslation } from 'react-i18next';
import logoImage from '@/assets/logo.png';

export default function Register() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    <div className="flex h-full flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
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
            <Input type="password" placeholder={t('auth.passwordTooShort')} value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">{t('auth.confirmPassword')}</label>
            <Input type="password" placeholder={t('auth.confirmPasswordPlaceholder')} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('auth.registering') : t('auth.register')}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-stone-400">{t('auth.hasAccount')}</span>
          <Link to="/login" className="ml-1 text-brand hover:text-brand-dark">{t('auth.loginNow')}</Link>
        </div>

        <p className="mt-4 text-center text-xs text-stone-400">
          {t('auth.agreeTerms')}
          <Link to="/terms" className="text-brand"> {t('auth.termsOfService')} </Link>
          {t('auth.and')}
          <Link to="/privacy" className="text-brand"> {t('auth.privacyPolicy')}</Link>
        </p>
      </div>
    </div>
  );
}
