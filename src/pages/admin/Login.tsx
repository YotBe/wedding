import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '../../hooks/useAdminAuth';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { session, isAdmin, signIn } = useAdminAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Already signed in as an admin? Skip the form.
  useEffect(() => {
    if (session && isAdmin) navigate('/admin', { replace: true });
  }, [session, isAdmin, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      navigate('/admin', { replace: true });
    } catch {
      setError(t('admin.login.error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-cream px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-5">
        <h1 className="text-center font-serif text-3xl text-stone-800">{t('admin.login.title')}</h1>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-stone-600">
            {t('admin.login.email')}
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-stone-800 focus:border-sand focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-stone-600">
            {t('admin.login.password')}
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-stone-800 focus:border-sand focus:outline-none"
          />
        </div>

        {error && <p className="text-center text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-sand px-8 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-sand-dark disabled:opacity-60"
        >
          {busy ? t('admin.login.submitting') : t('admin.login.submit')}
        </button>
      </form>
    </main>
  );
}
