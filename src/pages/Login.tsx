import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME_ZH, APP_TAGLINE } from '@/lib/constants';
import { MessageCircle } from 'lucide-react';

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
    <div className="flex h-full flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-brand shadow-lg">
            <MessageCircle className="h-10 w-10 text-white" fill="white" />
          </div>
          <h1 className="text-2xl font-bold text-stone-900">{APP_NAME_ZH}</h1>
          <p className="mt-1 text-sm text-stone-400">{APP_TAGLINE}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">邮箱</label>
            <Input
              type="email"
              placeholder="请输入邮箱"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">密码</label>
            <Input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '登录中...' : '登录'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-stone-400">还没有账号？</span>
          <Link to="/register" className="ml-1 text-brand hover:text-brand-dark">
            立即注册
          </Link>
        </div>

        <div className="mt-8 flex justify-center gap-4 text-xs text-stone-400">
          <Link to="/terms" className="hover:text-stone-600">服务条款</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:text-stone-600">隐私政策</Link>
        </div>
      </div>
    </div>
  );
}
