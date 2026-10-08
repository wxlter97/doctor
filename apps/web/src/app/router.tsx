import { createBrowserRouter } from 'react-router';
import { Layout } from './Layout';
import { Placeholder } from './Placeholder';
import { HomePage } from '../features/home/HomePage';
import { SettingsPage } from '../features/settings/SettingsPage';
import { t } from '../i18n/es-SV';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: 'medicamentos',
        lazy: async () => ({ Component: (await import('../features/medications/MedicationsLayout')).MedicationsLayout }),
        children: [
          { index: true, lazy: async () => ({ Component: (await import('../features/medications/MedicationsLayout')).MedicationsIndexPlaceholder }) },
          { path: ':id', lazy: async () => ({ Component: (await import('../features/medications/MedicationDetail')).MedicationDetail }) },
        ],
      },
      { path: 'calculadoras', lazy: async () => ({ Component: (await import('../features/calculators/CalculatorsPage')).CalculatorsPage }) },
      { path: 'calculadoras/:id', lazy: async () => ({ Component: (await import('../features/calculators/CalculatorPage')).CalculatorPage }) },
      { path: 'turnos', lazy: async () => ({ Component: (await import('../features/shifts/ShiftsPage')).ShiftsPage }) },
      { path: 'turnos/horas', lazy: async () => ({ Component: (await import('../features/shifts/HoursPage')).HoursPage }) },
      { path: 'turnos/tipos', lazy: async () => ({ Component: (await import('../features/shifts/TypesPage')).TypesPage }) },
      { path: 'fuentes', lazy: async () => ({ Component: (await import('../features/sources/SourcesPage')).SourcesPage }) },
      { path: 'ajustes', element: <SettingsPage /> },
      ...(import.meta.env.DEV
        ? [{ path: 'dev/tokens', lazy: async () => ({ Component: (await import('../features/dev/TokensPage')).TokensPage }) }]
        : []),
      { path: '*', element: <Placeholder title="404" body={t.notFound} /> },
    ],
  },
]);
