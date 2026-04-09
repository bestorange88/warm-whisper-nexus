import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME_ZH } from '@/lib/constants';
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
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-white px-6">
      <div className="mb-8 flex flex-col items-center">
        <img src={logoImage} alt={APP_NAME_ZH} className="h-20 w-20 rounded-2xl shadow-lg" />
        <h1 className="mt-4 text-2xl font-bold text-stone-900">{APP_NAME_ZH}</h1>
        <p className="mt-1 text-sm text-stone-400">{t('app.tagline')}</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
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
        <div className="flex gap-4 text-xs text-stone-400">
          <Link to="/terms" className="hover:underline">{t('auth.termsOfService')}</Link>
          <Link to="/privacy" className="hover:underline">{t('auth.privacyPolicy')}</Link>
        </div>
      </div>
    </div>
  );
}
