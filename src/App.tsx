
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import PlansPage from './pages/PlansPage';
import ExportPage from './pages/ExportPage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';

import { AuthInitializer } from './components/AuthInitializer';

function App() {
  return (
    <BrowserRouter>
      <AuthInitializer />
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/plans" element={<PlansPage />} />
          <Route path="/export" element={<ExportPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
