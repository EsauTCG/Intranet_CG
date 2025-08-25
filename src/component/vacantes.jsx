import React from "react";
import Styles from "../Style/vacantes.module.css";

export default function Vacantes({ collapsed}){
    return(

        <div className={Styles.Contenedor}>

            <h2>Vacantes Disponibles</h2>
            <p>Aqui Apareceran las vacantes se encuentren disponibles</p>

        </div>



    );
}