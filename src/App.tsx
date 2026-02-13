import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AuthInitializer } from './components/AuthInitializer';

const HomePage = lazy(() => import('./pages/HomePage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const PlansPage = lazy(() => import('./pages/PlansPage'));
const ExportPage = lazy(() => import('./pages/ExportPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const HistoryPage = lazy(() => import('./pages/HistoryPage'));

function App() {
  return (
    <BrowserRouter>
      <AuthInitializer />
      <Layout>
        <Suspense fallback={<div className="p-6 text-sm text-text-secondary">화면을 불러오는 중...</div>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/plans" element={<PlansPage />} />
            <Route path="/export" element={<ExportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
