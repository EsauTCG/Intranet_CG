import { FileDown, Filter, User, Building, Lock, Eye } from "lucide-react";
import "../Style/recursos.modules.css";
import { useAuth } from "../context/context";
import { useState, useMemo } from "react";

export default function Recursos() {
  const { isLoggedIn, loading, user } = useAuth();
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroArea, setFiltroArea] = useState('todas');

  // Configuración de recursos con permisos por rol y área
  const recursosConfig = [
    {
      id: 1,
      categoria: "Manuales",
      items: [
        {
          nombre: "Manual del Usuario",
          url: "/docs/manual-usuario.pdf",
          roles: ['Administrador' ,'Coordinador','Empleado'],
          areas: ["todas"],
          esPublico: true // Recurso público
        },
        {
          nombre: "Manual Técnico",
          url: "/docs/manual-tecnico.pdf",
          roles: ['Administrador' ,'Coordinador', "Empleado"],
          areas: ["Sistemas"],
          esPublico: false // Recurso privado
        },
        {
          nombre: "Manual de Procedimientos",
          url: "/docs/manual-procedimientos.pdf",
          roles: ["Administrador", "Coordinador"],
          areas: ["todas"],
          esPublico: false // Recurso privado
        }
      ]
    },
    {
      id: 2,
      categoria: "Reglamentos",
      items: [
        {
          nombre: "Reglamento Interno",
          url: "/docs/reglamento-interno.pdf",
          roles: ["Administrador", "Coordinador", "Empleado"],
          areas: ["todas"],
          esPublico: true // Recurso público
        },
        {
          nombre: "Reglamento de Seguridad",
          url: "/docs/reglamento-seguridad.pdf",
          roles: ["Administrador", "Coordinador", "Empleado"],
          areas: ["todas"],
          esPublico: true // Recurso público
        },
        {
          nombre: "Reglamento TI",
          url: "/docs/reglamento-ti.pdf",
          roles: ["Administrador", "Coordinador","Empleado"],
          areas: ["Sistemas"],
          esPublico: false // Recurso privado
        }
      ]
    },
    {
      id: 3,
      categoria: "Políticas",
      items: [
        {
          nombre: "Política de Privacidad",
          url: "/docs/politica-privacidad.pdf",
          roles: ["Administrador", "Coordinador", "Empleado"],
          areas: ["todas"],
          esPublico: true // Recurso público
        },
        {
          nombre: "Política de Seguridad",
          url: "/docs/politica-seguridad.pdf",
          roles: ["Administrador", "Coordinador"],
          areas: ["Todas"],
          esPublico: false // Recurso privado
        },
        {
          nombre: "Política de RRHH",
          url: "/docs/politica-rrhh.pdf",
          roles: ["Administrador", "Coordinador"],
          areas: ["RH"],
          esPublico: false // Recurso privado
        }
      ]
    },
    {
      id: 4,
      categoria: "Formatos",
      items: [
        {
          nombre: "Formato de Vacaciones",
          url: "/docs/formato-vacaciones.pdf",
          roles: ["Administrador", "Coordinador", "Empleado"],
          areas: ["todas"],
          esPublico: false // Recurso privado
        },
        {
          nombre: "Formato de Permisos",
          url: "/docs/formato-permisos.pdf",
          roles: ['Administrador' ,'Coordinador','Empleado'],
          areas: ["todas"],
          esPublico: false // Recurso privado
        },
        {
          nombre: "Formato de Evaluación",
          url: "/docs/formato-evaluacion.pdf",
          roles: ['Administrador' ,'Coordinador'],
          areas: ["RH"],
          esPublico: false // Recurso privado
        }
      ]
    }
  ];

  // Función para verificar si el usuario tiene acceso a un recurso
  const tieneAcceso = (item) => {
    // Si es público, siempre se puede ver
    if (item.esPublico) return true;
    
    // Si no está logueado y no es público, no puede acceder
    if (!isLoggedIn || !user) return false;
    
    const tieneRol = item.roles.includes(user.rol) || item.roles.includes('todos');
    const tieneArea = item.areas.includes(user.area) || item.areas.includes('todas');
    
    return tieneRol && tieneArea;
  };

  // Función para verificar si puede descargar
  const puedeDescargar = (item) => {
    // Los recursos públicos siempre se pueden descargar
    if (item.esPublico) return true;
    
    // Los recursos privados solo si está logueado y tiene acceso
    if (!isLoggedIn) return false;
    return tieneAcceso(item);
  };

  // Filtrar recursos según los filtros seleccionados y permisos del usuario
  const recursosFiltrados = useMemo(() => {
    return recursosConfig.map(seccion => ({
      ...seccion,
      items: seccion.items.filter(item => {
        // Verificar acceso del usuario
        if (!tieneAcceso(item)) return false;
        
        // Si no está logueado, solo aplicar filtros básicos para recursos públicos
        if (!isLoggedIn) {
          return item.esPublico;
        }
        
        // Aplicar filtros adicionales solo para usuarios logueados
        const cumpleFiltroRol = filtroRol === 'todos' || item.roles.includes(filtroRol);
        const cumpleFiltroArea = filtroArea === 'todas' || item.areas.includes(filtroArea);
        
        return cumpleFiltroRol && cumpleFiltroArea;
      })
    })).filter(seccion => seccion.items.length > 0);
  }, [filtroRol, filtroArea, isLoggedIn, user]);

  // Obtener roles y áreas únicos para los filtros (solo para usuarios logueados)
  const rolesDisponibles = useMemo(() => {
    if (!isLoggedIn) return [];
    const roles = new Set();
    recursosConfig.forEach(seccion => {
      seccion.items.forEach(item => {
        if (tieneAcceso(item)) {
          item.roles.forEach(rol => roles.add(rol));
        }
      });
    });
    return Array.from(roles).filter(rol => rol !== 'todos');
  }, [isLoggedIn, user]);

  const areasDisponibles = useMemo(() => {
    if (!isLoggedIn) return [];
    const areas = new Set();
    recursosConfig.forEach(seccion => {
      seccion.items.forEach(item => {
        if (tieneAcceso(item)) {
          item.areas.forEach(area => areas.add(area));
        }
      });
    });
    return Array.from(areas).filter(area => area !== 'todas');
  }, [isLoggedIn, user]);

  if (loading) {
    return <div className="centro-container">Cargando...</div>;
  }

  return (
    <div className="centro-container">
      <h2 className="centro-title">Centro de Recursos</h2>

      {/* Panel de información del usuario - Solo si está logueado */}
      {isLoggedIn && (
        <div className="usuario-info">
          <div className="usuario-datos">
            <User size={16} />
            <span>Rol: {user?.rol || 'No definido'}</span>
          </div>
          <div className="usuario-datos">
            <Building size={16} />
            <span>Área: {user?.area || 'No definida'}</span>
          </div>
        </div>
      )}

      {/* Mensaje informativo para usuarios no logueados */}
      {!isLoggedIn && (
        <div className="info-publico">
          <div className="info-mensaje">
            <Eye size={20} />
            <span>Viendo recursos públicos. Inicia sesión para acceder a recursos adicionales específicos para tu rol.</span>
          </div>
        </div>
      )}

      {/* Filtros - Solo para usuarios logueados */}
      {isLoggedIn && (
        <div className="filtros-container">
          <div className="filtro-grupo">
            <Filter size={16} />
            <span>Filtros:</span>
          </div>
          
          <div className="filtros-controles">
            <select 
              value={filtroRol} 
              onChange={(e) => setFiltroRol(e.target.value)}
              className="filtro-select"
            >
              <option value="todos">Todos los roles</option>
              {rolesDisponibles.map(rol => (
                <option key={rol} value={rol}>
                  {rol.charAt(0).toUpperCase() + rol.slice(1)}
                </option>
              ))}
            </select>

            <select 
              value={filtroArea} 
              onChange={(e) => setFiltroArea(e.target.value)}
              className="filtro-select"
            >
              <option value="todas">Todas las áreas</option>
              {areasDisponibles.map(area => (
                <option key={area} value={area}>
                  {area.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="centro-grid">
        {recursosFiltrados.map(seccion => (
          <section key={seccion.id} className="recurso-seccion">
            <h3>{seccion.categoria}</h3>
            
            <ul className="archivo-lista">
              {seccion.items.map((item, index) => (
                <li key={index} className={!item.esPublico ? 'recurso-privado' : 'recurso-publico'}>
                  {puedeDescargar(item) ? (
                    <a href={item.url} download>
                      <FileDown size={18} /> {item.nombre}
                    </a>
                  ) : (
                    <span className="recurso-bloqueado">
                      <Lock size={18} />
                      {item.nombre}
                    </span>
                  )}
                  
                  {/* Mostrar información de permisos solo para usuarios logueados */}
                  {isLoggedIn && (
                    <div className="permisos-info">
                      <small>
                        {item.esPublico ? (
                          <span className="publico-tag">Público</span>
                        ) : (
                          <span className="privado-tag">Privado</span>
                        )}
                        {!item.esPublico && (
                          <span> - Roles: {item.roles.join(', ')} | Áreas: {item.areas.join(', ')}</span>
                        )}
                      </small>
                    </div>
                  )}

                  {/* Mensaje para usuarios no logueados en recursos privados */}
                  {!isLoggedIn && !item.esPublico && (
                    <div className="mensaje-login">
                      <small>Inicia sesión para acceder a este recurso</small>
                    </div>
                  )}
                </li>
              ))}
            </ul>

            {seccion.items.length === 0 && (
              <p className="sin-recursos">
                {isLoggedIn 
                  ? "No hay recursos disponibles para tu rol/área con los filtros actuales."
                  : "No hay recursos públicos disponibles en esta sección."
                }
              </p>
            )}
          </section>
        ))}

        {recursosFiltrados.length === 0 && (
          <div className="sin-acceso">
            <p>
              {isLoggedIn 
                ? "No tienes acceso a ningún recurso o no hay recursos que coincidan con los filtros seleccionados."
                : "No hay recursos públicos disponibles en este momento."
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}