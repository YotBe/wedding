import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { LanguageProvider } from './i18n/LanguageProvider';
import Home from './pages/Home';

// Lazy-loaded so the Supabase client (and its env-var requirement) is only
// pulled in when a guest opens their RSVP link or an admin opens /admin — the
// public Home page stays independent of backend configuration.
const Rsvp = lazy(() => import('./pages/Rsvp'));
const FindTable = lazy(() => import('./pages/FindTable'));
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminLogin = lazy(() => import('./pages/admin/Login'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard'));
const Guests = lazy(() => import('./pages/admin/Guests'));
const Seating = lazy(() => import('./pages/admin/Seating'));

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rsvp/:token" element={<Rsvp />} />
            <Route path="/find-table" element={<FindTable />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="guests" element={<Guests />} />
              <Route path="seating" element={<Seating />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LanguageProvider>
  );
}
