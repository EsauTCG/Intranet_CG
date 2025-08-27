import { useState } from "react";
import Styles from "../Style/vacantes.module.css";
import CEDIS from "../imgs/CEDIS.png";
import Empaque from "../imgs/Empaque.png";
import Pieles from "../imgs/Pieles.jpg";

const vacantesData = [
  {
    id: 1,
    titulo: "EMPAQUE",
    descripcion: "Enbolsar y preparar productos para su envío.",
    imagen: Empaque,
    detalles: "Responsable de asegurar que los productos estén correctamente empaquetados y listos para su distribución. No se requiere experiencia previa."
  },
  {
    id: 2,
    titulo: "PIELES",
    descripcion: "Clasificar y preparar pieles para su procesamiento.",
    imagen: Pieles,
    detalles: "Experiencia en manejo de pieles y conocimiento básico de procesos de curtido. Se valorará experiencia previa en el sector."
  },
  {
    id: 3,
    titulo: "CEDIS",
    descripcion: "Gestión de inventarios y logística en el centro de distribución.",
    imagen: CEDIS,
    detalles: "Experiencia en logística y manejo de inventarios. Conocimiento de sistemas de gestión de almacenes es un plus."
  },
];

export default function Vacantes() {
  const [open, setOpen] = useState(false);
  const [vacanteSeleccionada, setVacanteSeleccionada] = useState(null);

  const handleOpen = (vacante) => {
    setVacanteSeleccionada(vacante);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setVacanteSeleccionada(null);
  };

  return (
  <div className={Styles.vacantescontainer}>
    {/* Encabezado de sección */}
    <header className={Styles.header}>
      <h1>Vacantes Disponibles</h1>
      <p>Estas son las oportunidades actuales dentro de la empresa</p>
    </header>

        {/* Grid de tarjetas */}
        <div className={Styles.vacantesgrid}>
            {vacantesData.map((vacante) => (
                <div
                key={vacante.id}
                className={Styles.vacantecard}
                onClick={() => handleOpen(vacante)}
                >
                <img src={vacante.imagen} alt={vacante.titulo} />
                <div className={Styles.cardcontent}>
                    <h3>{vacante.titulo}</h3>
                    <p>{vacante.descripcion}</p>
                </div>
                </div>
            ))}
        </div>


      {/* Modal */}
      {open && (
        <div className={Styles.modaloverlay} onClick={handleClose}>
          <div
            className={Styles.modalcontent}
            onClick={(e) => e.stopPropagation()} // evitar cerrar al hacer click dentro
          >
            <button className={Styles.closebtn} onClick={handleClose}>
              ✕
            </button>

            {vacanteSeleccionada && (
              <>
                <img
                  src={vacanteSeleccionada.imagen}
                  alt={vacanteSeleccionada.titulo}
                  className={Styles.modalimg}
                />
                <h2>{vacanteSeleccionada.titulo}</h2>
                <p><strong>{vacanteSeleccionada.descripcion}</strong></p>
                <p>{vacanteSeleccionada.detalles}</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
