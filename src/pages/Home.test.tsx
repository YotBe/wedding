import { describe, it, expect, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import i18n from '../i18n/index';
import { LanguageProvider } from '../i18n/LanguageProvider';
import Home from './Home';

async function setLanguage(lang: 'he' | 'en') {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
}

function renderHome() {
  return render(
    <LanguageProvider>
      <MemoryRouter>
        <Home />
      </MemoryRouter>
    </LanguageProvider>,
  );
}

describe('Home (public invitation)', () => {
  beforeEach(async () => {
    await setLanguage('he');
  });

  it('renders the main invitation sections', () => {
    renderHome();
    // Names appear in hero + header + footer.
    expect(screen.getAllByText('נטע & יותם').length).toBeGreaterThan(0);
    expect(document.querySelector('#story')).toBeTruthy();
    expect(document.querySelector('#schedule')).toBeTruthy();
    expect(document.querySelector('#location')).toBeTruthy();
    expect(document.querySelector('#rsvp')).toBeTruthy();
  });

  it('renders Hebrew schedule items from i18n', () => {
    renderHome();
    expect(screen.getByText('חופה')).toBeTruthy();
    expect(screen.getByText('קבלת פנים')).toBeTruthy();
  });

  it('switches all copy to English when the language changes', async () => {
    renderHome();
    await setLanguage('en');
    expect(screen.getAllByText('Our Story').length).toBeGreaterThan(0);
    expect(screen.getByText('Ceremony')).toBeTruthy();
  });
});
