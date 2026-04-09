import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME_ZH, APP_TAGLINE } from '@/lib/constants';
import logoImage from '@/assets/logo.png';

export default function Login() {
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
        setError(signInError.message === 'Invalid login credentials' ? '邮箱或密码错误' : signInError.message);
      } else {
        navigate('/');
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-white px-6">
      <div className="mb-8 flex flex-col items-center">
        <img src={logoImage} alt="阿基米●聊" className="h-20 w-20 rounded-2xl shadow-lg" />
        <h1 className="mt-4 text-2xl font-bold text-stone-900">{APP_NAME_ZH}</h1>
        <p className="mt-1 text-sm text-stone-400">{APP_TAGLINE}</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>
        )}
        <Input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Input
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-center">
        <p className="text-sm text-stone-500">
          还没有账号？{' '}
          <Link to="/register" className="font-medium text-brand hover:underline">
            注册
          </Link>
        </p>
        <div className="flex gap-4 text-xs text-stone-400">
          <Link to="/terms" className="hover:underline">服务条款</Link>
          <Link to="/privacy" className="hover:underline">隐私政策</Link>
        </div>
      </div>
    </div>
  );
}
