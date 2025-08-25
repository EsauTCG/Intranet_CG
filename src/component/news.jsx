import React from "react";
import "../Style/news.modules.css";

// 6 - Codigo

const fakeNews = [
  {
    id: 1,
    title: "Mantenimiento programado",
    description: "El sistema estará en mantenimiento el día 2 de agosto de 2:00 AM a 4:00 AM.",
    date: "2025-07-29",
  },
  {
    id: 2,
    title: "Nueva funcionalidad",
    description: "Próximamente se activará la opción para editar tu perfil directamente.",
    date: "2025-07-28",
  },
  {
    id: 3,
    title: "Recordatorio",
    description: "No olvides actualizar tu contraseña cada 90 días.",
    date: "2025-07-27",
  },
];

function News() {
  return (
    <div className="daily-news-container">
      <h2 className="daily-news-title"> Avisos del Día</h2>
      <div className="news-list">
        {fakeNews.map((item) => (
          <div key={item.id} className="news-card">
            <p className="news-date">{item.date}</p>
            <h3 className="news-heading">{item.title}</h3>
            <p className="news-description">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default News;
