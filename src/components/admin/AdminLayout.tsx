import { NavLink, Navigate, Outlet } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useAdminAuth } from '../../hooks/useAdminAuth';

export default function AdminLayout() {
  const { t } = useTranslation();
  const { loading, session, isAdmin, signOut } = useAdminAuth();

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-cream text-stone-500">
        {t('admin.loading')}
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-cream px-6 text-center">
        <h1 className="font-serif text-2xl text-stone-800">{t('admin.notAuthorizedTitle')}</h1>
        <p className="max-w-sm text-stone-600">{t('admin.notAuthorizedBody')}</p>
        <button
          type="button"
          onClick={() => void signOut()}
          className="rounded-full border border-stone-300 px-5 py-2 text-sm text-stone-700 hover:border-sand hover:text-sand-dark"
        >
          {t('admin.signOut')}
        </button>
      </div>
    );
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-4 py-1.5 text-sm transition ${
      isActive ? 'bg-sand text-white' : 'text-stone-600 hover:text-sand-dark'
    }`;

  return (
    <div className="min-h-[100dvh] bg-cream">
      <header className="sticky top-0 z-20 border-b border-stone-200/70 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <nav className="flex items-center gap-1">
            <NavLink to="/admin" end className={linkClass}>
              {t('admin.nav.dashboard')}
            </NavLink>
            <NavLink to="/admin/guests" className={linkClass}>
              {t('admin.nav.guests')}
            </NavLink>
            <NavLink to="/admin/seating" className={linkClass}>
              {t('admin.nav.seating')}
            </NavLink>
          </nav>
          <button
            type="button"
            onClick={() => void signOut()}
            className="text-sm text-stone-500 hover:text-sand-dark"
          >
            {t('admin.signOut')}
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
