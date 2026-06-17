import { describe, it, expect, beforeEach } from 'vitest';
import { act, render } from '@testing-library/react';
import i18n from './index';
import { LanguageProvider, useLanguage } from './LanguageProvider';

function Probe() {
  const { lang, dir } = useLanguage();
  return (
    <span data-testid="probe">
      {lang}-{dir}
    </span>
  );
}

async function setLanguage(lang: 'he' | 'en') {
  await act(async () => {
    await i18n.changeLanguage(lang);
  });
}

describe('LanguageProvider', () => {
  beforeEach(async () => {
    await setLanguage('he');
  });

  it('defaults to Hebrew and sets lang="he" dir="rtl" on <html>', () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    expect(document.documentElement.lang).toBe('he');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('switches the document to English LTR when the language changes', async () => {
    render(
      <LanguageProvider>
        <Probe />
      </LanguageProvider>,
    );

    await setLanguage('en');

    expect(document.documentElement.lang).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });
});
