import React, { useEffect, useState } from "react";
import "../Style/cumple.modules.css";

function getSaludoPorHora() {
  const hora = new Date().getHours();
  if (hora < 12) return "Hoy en este día te deseamos un feliz cumpleaños";
  if (hora < 18)
    return "En esta hermosa tarde de cumpleaños te enviamos nuestros mejores deseos";
  return "En esta mágica noche de cumpleaños, que todos tus sueños se hagan realidad.";
}

export default function Cumple({ collapsed }) {
  const [frase, setFrase] = useState("");
  const [saludo, setSaludo] = useState("");
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    fetch("http://localhost:5000/api/cumple-hoy")
      .then((res) => res.json())
      .then((data) => {
        if (data.tieneCumple) {
          setMostrar(true);
          setSaludo(getSaludoPorHora());

          const cantidad = data.nombres.length;
          let nombresFormateados = "";

          if (cantidad === 1) {
            nombresFormateados = data.nombres[0];
          } else if (cantidad === 2) {
            nombresFormateados = data.nombres.join(" y ");
          } else {
            nombresFormateados =
              data.nombres.slice(0, -1).join(", ") +
              " y " +
              data.nombres.slice(-1);
          }

          const frasesCumple =
            cantidad === 1
              ? [
                  `¡Feliz Cumpleaños a ${nombresFormateados}!`,
                  `Hora de felicitar a ${nombresFormateados} por otro año lleno de logros.`,
                  `¡Hoy celebramos a ${nombresFormateados}, un año más de sabiduría y experiencias!`,
                  `${nombresFormateados}, que este nuevo año te traiga aún más éxitos y alegrías.`,
                  `¡Brindemos por ${nombresFormateados} en su cumpleaños! Que sea un día lleno de sorpresas y felicidad.`,
                ]
              : [
                  `¡Feliz Cumpleaños a todos: ${nombresFormateados}! 🎉`,
                  `Hoy celebramos a ${nombresFormateados}, que este año esté lleno de alegrías para cada uno.`,
                  `¡Brindemos por ${nombresFormateados} en este día especial!`,
                  `Felicidades a ${nombresFormateados}, un año más para cumplir sueños y metas.`,
                  `¡Un gran aplauso para ${nombresFormateados}! Que tengan un día increíble.`,
                ];

          const aleatorio =
            frasesCumple[Math.floor(Math.random() * frasesCumple.length)];
          setFrase(aleatorio);
        }
      })
      .catch((err) => console.error("Error al verificar cumpleaños", err));
  }, []);

  if (!mostrar) return null;

  return (
    <header className={`cumple-header ${collapsed ? "collapsed" : ""}`}>
      <div>
        <h3>{saludo}</h3>
        <p className="motivaciones">{frase}</p>
      </div>
    </header>
  );
}
