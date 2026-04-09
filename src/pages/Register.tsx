import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME_ZH } from '@/lib/constants';
import logoImage from '@/assets/logo.png';

export default function Register() {
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

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }
    if (username.length < 2) {
      setError('用户名至少需要2个字符');
      return;
    }

    setLoading(true);
    try {
      const { error: signUpError } = await signUp(email, password, username);
      if (signUpError) {
        setError(signUpError.message);
      } else {
        navigate('/');
      }
    } catch {
      setError('注册失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col items-center justify-center bg-white px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <img src={logoImage} alt="阿基米●聊" className="mb-4 h-16 w-16 rounded-2xl shadow-lg" />
          <h1 className="text-xl font-bold text-stone-900">注册 {APP_NAME_ZH}</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
          )}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">用户名</label>
            <Input
              type="text"
              placeholder="请输入用户名"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
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
              placeholder="至少6个字符"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-stone-700">确认密码</label>
            <Input
              type="password"
              placeholder="再次输入密码"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '注册中...' : '注册'}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-stone-400">已有账号？</span>
          <Link to="/login" className="ml-1 text-brand hover:text-brand-dark">
            立即登录
          </Link>
        </div>

        <p className="mt-4 text-center text-xs text-stone-400">
          注册即表示您同意我们的
          <Link to="/terms" className="text-brand"> 服务条款 </Link>
          和
          <Link to="/privacy" className="text-brand"> 隐私政策</Link>
        </p>
      </div>
    </div>
  );
}
