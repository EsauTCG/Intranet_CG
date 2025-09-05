import { Home, FileText, LogOut, Menu, HatGlasses, Handshake, IdCardLanyard, NotebookPen, FileCode } from "lucide-react";
import "../Style/sidebar.modules.css";
import Carnes from "../imgs/Carnes G.png";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/context";

// Enlaces de navegación

export default function Sidebar({ collapsed, setCollapsed }) {

  const { logout, hasArea } = useAuth();

  // Enlaces base
  const navItems = [
    { icon: <Home size={20} />, label: "Inicio", link: "/" },
    { icon: <FileText size={20} />, label: "Documentos", link: "/documentos" },
    { icon: <Handshake size={20} />, label: "Convenios", link: "/convenios" },
    
    
  ];

  // Enlaces protegidos
  const privateItems = [
    { icon: <HatGlasses size={20} />, label: "Denuncias", link: "/denuncias" },
    { icon: <NotebookPen size={20} />, label: "Mis Solicitudes", link: "/solicitudes" },
    { icon: <IdCardLanyard size={20} />, label: "Vacantes", link: "/vacantes" }

  ];

  const areaItems = [];
  if (hasArea("Marketing") || hasArea("RH")) {
    areaItems.push({
      icon: <FileCode size={20} />, // cámbialo por el ícono que prefieras
      label: "Altas",
      link: "/altas"
    });
  }

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        {!collapsed && <img src={Carnes} alt="Logo" className="logo" />}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="toggle-btn"
          aria-label="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>
      </div>

      <nav className="sidebar-nav">
         {/*{[...navItems, ...(isLoggedIn ? privateItems : [])].map((item, i) => (*/}
         {[...navItems, ...privateItems, ...areaItems].map((item, i) => (
          <NavLink
            to={item.link}
            key={i}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            {item.icon}
            {!collapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="nav-item logout"  onClick={logout}>
          <LogOut size={20} />
          {!collapsed && <span>Cerrar Sesión</span>}
        </div>
      </div>
    </aside>
  );
}
