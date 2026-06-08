import { createBrowserRouter } from 'react-router';
import { MainLayout } from './components/layout/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { BatchList } from './pages/batches/BatchList';
import { BatchUpload } from './pages/batches/BatchUpload';
import { BatchDetail } from './pages/batches/BatchDetail';
import { ServiceTypes } from './pages/config/ServiceTypes';
import { Tariffs } from './pages/config/Tariffs';
import { SystemParameters } from './pages/config/SystemParameters';
import { SystemHealth } from './pages/health/SystemHealth';
import { Login } from './pages/Login';
import { ProtectedRoute } from './components/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/',
    Component: ProtectedRoute,
    children: [
      {
        Component: MainLayout,
        children: [
          { index: true, Component: Dashboard },
          { path: 'batches', Component: BatchList },
          { path: 'batches/all', Component: BatchList },
          { path: 'batches/upload', Component: BatchUpload },
          { path: 'batches/:id', Component: BatchDetail },
          { path: 'config/services', Component: ServiceTypes },
          { path: 'config/tariffs', Component: Tariffs },
          { path: 'config/parameters', Component: SystemParameters },
          { path: 'health', Component: SystemHealth },
        ],
      },
    ],
  },
], { basename: '/switch' });
