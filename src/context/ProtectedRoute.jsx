import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context';

const ProtectedRoute = ({ children, requiredRoles = [], requiredAreas = [] }) => {
  const { isLoggedIn, loading, hasAccess } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px' 
      }}>
        Cargando...
      </div>
    );
  }

  // Si no está logueado, redirigir al login
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!hasAccess(requiredRoles, requiredAreas)) {
    return <Navigate to="/" replace />;
  }

  // Si pasa validaciones, renderiza el componente
  return children;
};

export default ProtectedRoute;
