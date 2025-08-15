import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import MarketplacePage from './pages/MarketplacePage';
import StakingPage from './pages/StakingPage';
import HeroDetailPage from './pages/HeroDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import RequireAuth from './components/auth/RequireAuth';
import ErrorBoundary from './components/ui/ErrorBoundary';

// Definición de rutas principales. Usamos rutas anidadas para compartir layout persistente.
export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<MainLayout />}> 
          <Route index element={<LandingPage />} />
          <Route path="dashboard" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="marketplace" element={<MarketplacePage />} />
          <Route path="staking" element={<RequireAuth><StakingPage /></RequireAuth>} />
          <Route path="hero/:id" element={<HeroDetailPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}


