import React from "react";
import styles from "../Style/presentacion.module.css"

function Presentacion(){
    return(
        <div className={styles.presentacion}>
            <h1>Comienza a vivir la <span className={styles.exp}>Experiencia</span> </h1>
            <p className={styles.texto}>Bienvenidos a la Comunidad de Carnes G, nuestra nueva pagina de intranet diseña especialmente para ti.
            Aqui podras mantenerte al tanto de avisos importantes, acceder facilmente a documentos importantes,
            realizar solicitudes, enviar denuncias anonimas y mucho mas.
            </p>

            <p className={styles.texto}>Este espacio fue creado para fortalecer la comunicacion interna y facilitar tu dia a dia como colaborador.
            ¡Explora , participa y mantente conectado!
            </p>
        </div>
    );
}

export default Presentacion;