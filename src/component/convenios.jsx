import { useState } from "react";
import Styles from "../Style/convenios.module.css"

import Analisis from "../imgs/Analisis Clinicos.png";
import Boliche from "../imgs/Boliche.png";
import Dental from "../imgs/Dental a2.png";
import Gimnasio from "../imgs/Gimnasio.png";
import Mariscos from "../imgs/Mariscos.png";
import Nutriologa from "../imgs/Nutriologa.png";
import Optica from "../imgs/Optica.png";
import Ortopedia from "../imgs/Ortopedia.png";
import Pediatra from "../imgs/Pediatra.png";
import Restaurante from "../imgs/Restaurante.png";
import Ropa from "../imgs/Ropa.png";
import Terapia from "../imgs/Terapia.png";



const conveniosData = [
  {
    id: 1,
    titulo: "Analisis Clinicos",
    descripcion: "Analisis y pruebas de laboratorio.",
    imagen: Analisis,
  },
  {
    id: 2,
    titulo: "Boliche",
    descripcion: "Divierte y juega",
    imagen: Boliche,
  },
  {
    id: 3,
    titulo: "Dental a2",
    descripcion: "Servicios dentales",
    imagen: Dental,
  },
  {
    id: 4,
    titulo: "Gimnasio",
    descripcion: "Entrenamiento y bienestar físico.",
    imagen: Gimnasio,
  },
  {
    id: 5,
    titulo: "Mariscos",
    descripcion: "Deliciosos platillos de mariscos.",
    imagen: Mariscos,
  },
  {
    id: 6,
    titulo: "Nutriologa",
    descripcion: "Consulta y seguimiento nutricional.",
    imagen: Nutriologa,
  },
  {
    id: 7,
    titulo: "Optica",
    descripcion: "Exámenes de la vista y venta de lentes.",
    imagen: Optica,
  },
    {
    id: 8,
    titulo: "Ortopedia",
    descripcion: "Servicios ortopédicos",
    imagen: Ortopedia,
  },
    {
    id: 9,
    titulo: "Pediatra",
    descripcion: "Cuidado y atención infantil.",
    imagen: Pediatra,
  },
    {
    id: 10,
    titulo: "Restaurante",
    descripcion: "Deliciosos platillos y un ambiente acogedor.",
    imagen: Restaurante,
  },
    {
    id: 11,
    titulo: "Ropa",
    descripcion: "Variedad de prendas y estilos.",
    imagen: Ropa,
  },
    {
    id: 12,
    titulo: "Terapia",
    descripcion: "Servicios de terapia y bienestar mental.",
    imagen: Terapia,
  },
  
];

export default function Convenios (){

const [open, setOpen] = useState(false);
  const [conve, setConvenioSeleccionada] = useState(null);

  const handleOpen = (convenio) => {
    setConvenioSeleccionada(convenio);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setConvenioSeleccionada(null);
  };

  return (
  <div className={Styles.convenioscontainer}>
    {/* Encabezado de sección */}
    <header className={Styles.header}>
      <h1>Convenios Carnes G</h1>
      <p>Enterate de todos los lugares donde puedes hacer uso de descuentos y promociones especiales por ser parte de la familia Carnes G</p>
    </header>

        {/* Grid de tarjetas */}
        <div className={Styles.conveniosgrid}>
            {conveniosData.map((convenios) => (
                <div
                key={convenios.id}
                className={Styles.convenioscard}
                onClick={() => handleOpen(convenios)}
                >
                <img src={convenios.imagen} alt={convenios.titulo} />
                <div className={Styles.cardcontent}>
                    <h3>{convenios.titulo}</h3>
                    <p>{convenios.descripcion}</p>
                </div>
                </div>
            ))}
        </div>


      {/* Modal */}
      {open && (
         <div className={`${Styles.modaloverlay} ${!open ? Styles.hidden : ""}`} onClick={handleClose}>
          <div
            className={Styles.modalcontent}
            onClick={(e) => e.stopPropagation()} // evitar cerrar al hacer click dentro
          >
            <button className={Styles.closebtn} onClick={handleClose}>
              ✕
            </button>

            {conve && (
              <>
                <img
                  src={conve.imagen}
                  alt={conve.titulo}
                  className={Styles.modalimg}
                />
                <h2>{conve.titulo}</h2>
                <p><strong>{conve.descripcion}</strong></p>
                <p>{conve.detalles}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>

    );
}