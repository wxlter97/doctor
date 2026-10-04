import { createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { Placeholder } from './Placeholder';
import { SettingsPage } from '../features/settings/SettingsPage';
import { t } from '../i18n/es-SV';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <Placeholder title={t.home.title} body={t.home.empty} /> },
      { path: 'medicamentos', element: <Placeholder title={t.medications.title} body={t.medications.empty} /> },
      { path: 'calculadoras', element: <Placeholder title={t.calculators.title} body={t.calculators.empty} /> },
      { path: 'turnos', element: <Placeholder title={t.shifts.title} body={t.shifts.empty} /> },
      { path: 'ajustes', element: <SettingsPage /> },
      ...(import.meta.env.DEV
        ? [{ path: 'dev/tokens', lazy: async () => ({ Component: (await import('../features/dev/TokensPage')).TokensPage }) }]
        : []),
      { path: '*', element: <Placeholder title="404" body={t.notFound} /> },
    ],
  },
]);
