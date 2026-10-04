import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router/dom';
import { router } from './app/router';
import { applyPrefs, usePrefs } from './stores/prefs';
import './app/sw-register';
import './index.css';

const { theme, density } = usePrefs.getState();
applyPrefs({ theme, density });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
