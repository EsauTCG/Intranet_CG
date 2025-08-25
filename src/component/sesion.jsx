import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { 
  User, 
  Lock, 
  LogIn,  
  Shield, 
  AlertCircle,
  Loader2 
} from "lucide-react";
import styles from "../Style/sesion.module.css";
import { useAuth } from "../context/context";

const Login = () => {
  const { login, isLoggedIn, loading } = useAuth();

  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsAuthenticating(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ usuario, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Error en autenticación");
        setIsAuthenticating(false);
        return;
      }

      if (!data.token || !data.user) {
        setError("Respuesta incompleta del servidor");
        setIsAuthenticating(false);
        return;
      }

      login(data.token, data.user);
    } catch (err) {
      console.error("⚠️ Error de conexión:", err);
      setError("Error al conectar con el servidor");
    } finally {
      setIsAuthenticating(false);
    }
  };

  if (isLoggedIn) {
    return <Navigate to="/home" replace />;
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loader}></div>
        <div className={styles.loadingText}>
          <Shield size={20} />
          <p>Verificando sesión existente...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.loginWrapper}>
      <div className={styles.loginCard}>
        <div className={styles.brandContainer}>
          <h2 className={styles.title}>Carnes G</h2>
        </div>
        
        <p className={styles.subtitle}>
          <Shield size={18} />
          Inicio de Sesión
        </p>

        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.inputContainer}>
            <User size={20} className={styles.inputIcon} />
            <input
              type="text"
              placeholder="Nombre Completo"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              required
              className={styles.input}
              autoComplete="username"
            />
          </div>

          <div className={styles.inputContainer}>
            <Lock size={20} className={styles.inputIcon} />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.input}
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            disabled={isAuthenticating} 
            className={styles.button}
          >
            {isAuthenticating ? (
              <>
                <Loader2 size={18} className={styles.buttonIcon} style={{animation: 'spin 1s linear infinite'}} />
                Autenticando...
              </>
            ) : (
              <>
                <LogIn size={18} className={styles.buttonIcon} />
                Ingresar
              </>
            )}
          </button>
        </form>

        {error && (
          <div className={styles.errorMessage}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;