import React, { useState, useEffect } from 'react';
import Sidebar from '../component/sidebar';
import UserHeader from '../component/usuario';
//import News from '../component/news';
import Cumple from '../component/cumple';
import Atajos from '../component/atajos';
import Footer from '../component/footer';
import Carousel from '../component/carousel';
import slides from '../component/noticias';
import Presentacion from '../component/presentacion';
import '../Style/home.modules.css';

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

// 3 - Codigo

  return (
    <div className="layout">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
        <UserHeader collapsed={collapsed} />
        <br/>
        {/*<News collapsed={collapsed} />*/}
        <Presentacion collapsed={collapsed}/>
        <Carousel collapsed={collapsed} slides={slides}/>
        <Atajos collapsed={collapsed}/>
        <br/>        
        <Cumple collapsed={collapsed} />
        <Footer collapsed={collapsed}/>
      </div>
    </div>
  );
}

export default Home;
