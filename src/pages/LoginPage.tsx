import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { Button, Input } from '../components/ui';
import { getErrorMessage } from '../lib/utils';

const roleRedirect = { EMPLOYEE: '/employee/goals', MANAGER: '/manager/team', ADMIN: '/admin/users' };

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, isAuthenticated, user } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  function validateLogin(): boolean {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) e.email = 'Enter a valid email address';
    if (!password) e.password = 'Password is required';
    else if (password.length < 4) e.password = 'Password must be at least 4 characters';
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  }

  if (isAuthenticated() && user) {
    navigate(roleRedirect[user.role], { replace: true });
  }

  const login = useMutation({
    mutationFn: () => api.post('/api/auth/login', { email, password }),
    onSuccess: (res) => {
      const { token, user } = res.data;
      setAuth(token, user);
      navigate(roleRedirect[user.role as keyof typeof roleRedirect]);
    },
    onError: (err) => {
      setError(getErrorMessage(err));
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (validateLogin()) login.mutate();
  }

  return (
    <div className="min-h-screen bg-bg-base bg-grid flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-sm animate-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl mb-4">
            <Shield size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">AtomQuest</h1>
          <p className="text-text-muted text-sm mt-1 font-mono">GOAL SETTING & TRACKING PORTAL</p>
        </div>

        {/* Card */}
        <div className="bg-bg-surface border border-bg-border rounded-2xl p-6 shadow-2xl">
          <h2 className="text-lg font-semibold text-text-primary mb-1">Sign in</h2>
          <p className="text-sm text-text-muted mb-6">Enter your credentials to continue</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErrors((p) => ({ ...p, email: '' })); }}
              error={fieldErrors.email}
              autoFocus
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-text-muted uppercase tracking-wide">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })); }}
                  className={`w-full bg-bg-elevated border ${fieldErrors.password ? 'border-danger' : 'border-bg-border'} text-text-primary placeholder-text-muted rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors`}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {fieldErrors.password && <p className="text-xs text-danger">{fieldErrors.password}</p>}
            </div>

            {error && (
              <div className="bg-danger/10 border border-danger/20 rounded-lg px-3 py-2.5 text-sm text-danger">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full justify-center" loading={login.isPending} size="lg">
              Sign in
            </Button>
          </form>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 bg-bg-surface/60 border border-bg-border rounded-xl p-4">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Demo Credentials</p>
          <div className="space-y-2">
            {[
              { role: 'Admin', email: 'admin@test.com', pass: 'admin123' },
              { role: 'Manager', email: 'manager@test.com', pass: 'manager123' },
              { role: 'Employee', email: 'employee@test.com', pass: 'employee123' },
            ].map((c) => (
              <button
                key={c.role}
                type="button"
                onClick={() => { setEmail(c.email); setPassword(c.pass); setError(''); }}
                className="w-full flex items-center justify-between px-3 py-2 bg-bg-elevated hover:bg-bg-border rounded-lg transition-colors text-left group"
              >
                <span className="text-xs font-medium text-text-muted group-hover:text-text-primary transition-colors">{c.role}</span>
                <span className="text-xs font-mono text-text-dim group-hover:text-text-muted transition-colors">{c.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
