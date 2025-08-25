import React from "react";
import styles from "../Style/footer.module.css";
import Carnes from "../imgs/Carnes G.png";
import { NavLink } from "react-router-dom";

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.section}>
          <img className={styles.logo} alt="Logo Carnes G" src={Carnes}/>
          <p>Calidad Garantizada</p>
        </div>

        <div className={styles.section}>
          <h3>Enlaces</h3>
          <ul className={styles.linkList}>
            <li><NavLink to="/">Inicio</NavLink></li>
            <li><NavLink to="/documentos">Documentos</NavLink></li>
          </ul>
        </div>

        <div className={styles.section}>
          <h3>Contacto</h3>
          <p>Email: contacto@carnesG.mx</p>
          <p>Tel: +52 ### #### ###</p>
        </div>
      </div>

      <div className={styles.footerBottom}>
        <p>&copy; {new Date().getFullYear()} Carnes G. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;
