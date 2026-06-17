import { BrowserRouter, Route, Routes } from 'react-router';
import { LanguageProvider } from './i18n/LanguageProvider';
import Home from './pages/Home';

export default function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  );
}
