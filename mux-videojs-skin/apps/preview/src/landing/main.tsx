/** @jsxImportSource react */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '@videojs/react/i18n';

import '@/skin.css';
import './landing.css';
import { LandingPage } from './landing-page';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider locale="en">
      <LandingPage />
    </I18nProvider>
  </StrictMode>
);
