import React, { useEffect, useState } from "react";
import { User } from "lucide-react";
import { NavLink } from "react-router-dom";
import "../Style/usuario.modules.css";
import { useAuth } from "../context/context";

const frasesMotivacionales = [
  "¡Hoy es un buen día para aprender algo nuevo!",
  "Recuerda: cada paso te acerca a tu meta.",
  "El esfuerzo de hoy es el éxito de mañana.",
  "Confía en tu proceso.",
  "No te rindas, lo mejor está por venir.",
];

function getSaludoPorHora() {
  const hora = new Date().getHours();
  if (hora < 12) return "¡Buenos días!";
  if (hora < 18) return "¡Buenas tardes!";
  return "¡Buenas noches!";
}

export default function UserHeader({ collapsed }) {
  const { user, isLoggedIn } = useAuth(); // ✅ usamos el context
  const [frase, setFrase] = useState("");
  const [saludo, setSaludo] = useState("");

  useEffect(() => {
    setSaludo(getSaludoPorHora());
    const aleatorio =
      frasesMotivacionales[
        Math.floor(Math.random() * frasesMotivacionales.length)
      ];
    setFrase(aleatorio);
  }, []);

  return (
    <header className={`user-header ${collapsed ? "collapsed" : ""}`}>
      <div className="user-header-left">
        <h2 className="saludo">{saludo}</h2>
        <p className="motivacion">"{frase}"</p>
      </div>

      <div className="user-header-right">
        {isLoggedIn && user ? (
          <div className="user-info">
            <div className="user-profile">
              <User size={20} />
              <span className="user-name">{user.nombre || user.Nombre || user.usuarioAD || user.UsuarioAD}</span>
            </div>
          </div>
        ) : (
          <NavLink to="/login" className="login-placeholder">
            <User size={20} />
            Iniciar Sesión
          </NavLink>
        )}
      </div>
    </header>
  );
}
