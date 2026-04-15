import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';

import { useTranslation } from 'react-i18next';
import logoImage from '@/assets/logo.png';

export default function Login() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(signInError.message === 'Invalid login credentials' ? t('auth.invalidCredentials') : signInError.message);
      } else {
        navigate('/');
      }
    } catch {
      setError(t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="safe-area-top safe-area-bottom flex h-full flex-col overflow-y-auto bg-gradient-to-b from-orange-50 to-white">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-6 py-10">
        <div className="mb-8 flex flex-col items-center">
          <img src={logoImage} alt={t('app.name')} className="h-20 w-20 rounded-2xl shadow-lg" />
          <h1 className="mt-4 text-2xl font-bold text-stone-900">{t('app.name')}</h1>
          <p className="mt-1 text-sm text-stone-400">{t('app.tagline')}</p>
        </div>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
          )}
          <Input type="email" placeholder={t('auth.emailPlaceholder')} value={email} onChange={(e) => setEmail(e.target.value)} required />
          <Input type="password" placeholder={t('auth.passwordPlaceholder')} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? t('auth.loggingIn') : t('auth.login')}
          </Button>
        </form>

        <div className="mt-6 space-y-2 text-center">
          <p className="text-sm text-stone-500">
            {t('auth.noAccount')}{' '}
            <Link to="/register" className="font-medium text-brand hover:underline">{t('auth.registerNow')}</Link>
          </p>
          <div className="flex justify-center gap-4 text-xs text-stone-400">
            <Link to="/terms" className="hover:underline">{t('auth.termsOfService')}</Link>
            <Link to="/privacy" className="hover:underline">{t('auth.privacyPolicy')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
