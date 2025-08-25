import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context';

const ProtectedRoute = ({ children }) => {
  const { isLoggedIn, loading } = useAuth();
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
    // Guardar la ubicación actual para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si está logueado, mostrar el componente
  return children;
};

export default ProtectedRoute;