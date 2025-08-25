import React, { useState, useEffect } from 'react';
import Sidebar from "../component/sidebar";
import Sesion from "../component/sesion";
//import UserHeader from '../component/usuario';

// 16 - Codigo

export default function Login() {

const [collapsed, setCollapsed] = useState(false);

  
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

    return (
        <div className="layout">
              <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
              <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
                {/*<UserHeader collapsed={collapsed} /> */}
                <Sesion collapsed={collapsed} />
              </div>
            </div>
        
    );
}