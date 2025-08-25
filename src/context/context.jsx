import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar si hay sesión guardada al cargar la app
// Verificar si hay sesión guardada al cargar la app
useEffect(() => {
  const savedToken = localStorage.getItem("token");
  const savedUser = localStorage.getItem("user");

  if (savedToken && savedUser) {
    try {
      const parsedUser = JSON.parse(savedUser);

      // Si el token está expirado, limpiar sesión
      if (isTokenExpired(savedToken)) {
        logout();
      } else {
        setToken(savedToken);
        setUser(parsedUser);
        setIsLoggedIn(true);
      }
    } catch (error) {
      console.error("Error al parsear usuario guardado:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  }

  setLoading(false);
}, []);

  const login = (newToken, newUser) => {
    // Asegurar que el usuario tenga rol y área
    const userWithDefaults = {
      ...newUser,
      rol: newUser.rol || newUser.Rol || 'Empleado',
      area: newUser.area || newUser.Area || 'General'
    };

    setToken(newToken);
    setUser(userWithDefaults);
    setIsLoggedIn(true);
    
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userWithDefaults));
    
    console.log('✅ Usuario logueado:', userWithDefaults);
    
    const intendedDestination = location.state?.from?.pathname || '/';
    navigate(intendedDestination, { replace: true });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    console.log('👋 Usuario deslogueado');
    navigate('/login');
  };

  // Función para verificar si el token está expirado
  const isTokenExpired = (token) => {
    if (!token) return true;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch (error) {
      return true;
    }
  };

  // Función para verificar si el usuario tiene un rol específico
  const hasRole = (role) => {
    return user?.rol === role;
  };

  // Función para verificar si el usuario pertenece a un área específica
  const hasArea = (area) => {
    return user?.area === area;
  };

  // Función para verificar si el usuario tiene acceso a un recurso
  const hasAccess = (requiredRoles = [], requiredAreas = []) => {
    if (!isLoggedIn || !user) return false;
    
    const hasRequiredRole = requiredRoles.length === 0 || 
                           requiredRoles.includes('todos') || 
                           requiredRoles.includes(user.rol);
    
    const hasRequiredArea = requiredAreas.length === 0 || 
                           requiredAreas.includes('todas') || 
                           requiredAreas.includes(user.area);
    
    return hasRequiredRole && hasRequiredArea;
  };

  // Función para actualizar información del usuario
  const updateUser = (newUserData) => {
    const updatedUser = { ...user, ...newUserData };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    isLoggedIn,
    user,
    token,
    loading,
    login,
    logout,
    isTokenExpired,
    hasRole,
    hasArea,
    hasAccess,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};