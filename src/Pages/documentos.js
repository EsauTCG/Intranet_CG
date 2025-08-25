import React, { useState, useEffect } from 'react';
import Sidebar from '../component/sidebar';
import UserHeader from '../component/usuario';
import Recursos from '../component/recursos';
import Cumple from '../component/cumple';
import Footer from '../component/footer';
import '../Style/documentos.modules.css';

function Docs() {
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
        <UserHeader collapsed={collapsed} />
        <Recursos collapsed={collapsed} />    
        <br/> 
        <Cumple collapsed={collapsed} />
        <Footer collapsed={collapsed}/>
      </div>
    </div>
  );
}

export default Docs;