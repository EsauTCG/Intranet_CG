import React, { useState, useEffect } from 'react';
import Sidebar from '../component/sidebar';
import UserHeader from '../component/usuario';
import Cumple from '../component/cumple';
import Footer from '../component/footer';
import Vacantes from '../component/vacantes';

function Home() {
  const [collapsed, setCollapsed] = useState(false);

  // 2 - Codigo
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

//  - Codigo

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
        <UserHeader collapsed={collapsed} />
        <br/>
        <br/>
        <Vacantes collapsed={collapsed}/>
        <Cumple collapsed={collapsed} />
        <Footer collapsed={collapsed}/>
      </div>
    </div>
  );
}

export default Home;