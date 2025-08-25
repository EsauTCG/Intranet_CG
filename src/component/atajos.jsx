import React, { useState } from "react";
import {FileUser, BookOpenText, UserStar} from "lucide-react";
import style from "../Style/atajos.module.css";

const shortcuts = [
  {
    id: 1,
    title: "Políticas",
    description: "Consulta las políticas internas y lineamientos.",
    file: "/docs/politicas.txt",
    icon: <FileUser className="icon" />,
  },
  {
    id: 2,
    title: "Reglamento",
    description: "Revisa el reglamento general vigente.",
    file: "/docs/reglamentos.txt",
    icon: <BookOpenText className="icon" />,
  },
  {
    id: 3,
    title: "Reconocimientos",
    description: "Conoce a los empleados destacados.",
    file: "/docs/reconocimientos.txt",
    icon: <UserStar className="icon" />,
  },
];

function Atajos() {
  const [activeShortcut, setActiveShortcut] = useState(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  // 9 - Codigo

  const openModal = async (shortcut) => {
    setLoading(true);
    setActiveShortcut(shortcut);

    try {
      const response = await fetch(shortcut.file);
      const text = await response.text();
      setContent(text);
    } catch (error) {
      setContent("No se pudo cargar el contenido.");
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setActiveShortcut(null);
    setContent("");
  };

  // 10 - Codigo

  const downloadFile = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      alert("No se pudo descargar el archivo.");
      console.error(error);
    }
  };

  // 11 - Codigo

  return (
    <div className= {style.quicklinkscontainer}>
      <h2 className={style.quicklinkstitle}> Atajos Rápidos</h2>
      <div className={style.quicklinksgrid}>
        {shortcuts.map((item) => (
          <div
            key={item.id}
            className={style.cardmain}
            onClick={() => openModal(item)}
          >
            {item.icon}
            <h3 className={style.cardtitle}>{item.title}</h3>
            <p className={style.carddesc}>{item.description}</p>
          </div>
        ))}
      </div>

      {activeShortcut && (
        <div className={style.modaloverlay} onClick={closeModal}>
          <div className={style.modalcontent} onClick={(e) => e.stopPropagation()}>
            <button className={style.modalclose} onClick={closeModal}>×</button>
            <h3>{activeShortcut.title}</h3>

            <div className="modal-actions">
              <button
                className={style.downloadbtn}
                onClick={() =>
                  downloadFile(activeShortcut.file, `${activeShortcut.title}.txt`)
                }
              >
                Descargar archivo
              </button>
            </div>

            {loading ? (
              <p>Cargando contenido...</p>
            ) : (
              <pre style={{ whiteSpace: "pre-wrap" }}>{content}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Atajos;
