// @ts-nocheck
import { Navigate, useLocation } from 'react-router-dom';
import { getToken } from '../../lib/api';

export default function RequireAuth({ children }: { children: JSX.Element }) {
  const token = getToken();
  const location = useLocation();
  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
}


