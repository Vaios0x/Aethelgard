// @ts-nocheck
import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '../../lib/api';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const backendEnabled = (import.meta.env.VITE_ENABLE_BACKEND === 'true') && Boolean(import.meta.env.VITE_BACKEND_URL);
  const token = backendEnabled ? getToken() : null;
  const location = useLocation();
  if (backendEnabled && !token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
}



