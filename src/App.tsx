import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router';
import { LanguageProvider } from './i18n/LanguageProvider';
import Home from './pages/Home';

// Lazy-loaded so the Supabase client (and its env-var requirement) is only
// pulled in when a guest actually opens their RSVP link — the public Home
// page stays independent of backend configuration.
const Rsvp = lazy(() => import('./pages/Rsvp'));

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rsvp/:token" element={<Rsvp />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </LanguageProvider>
  );
}
