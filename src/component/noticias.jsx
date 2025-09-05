import { useEffect, useState } from "react";

export default function CarouselDataFetcher() {
  const [slides, setSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/carousel")
      .then((res) => {
        if (!res.ok) {
          throw new Error('Error al cargar slides');
        }
        return res.json();
      })
      .then((data) => {
        console.log('Slides recibidos:', data); // Para debug
        setSlides(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando carousel:", err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Cargando carousel...</div>;
  if (error) return <div>Error: {error}</div>;
  if (slides.length === 0) return <div>No hay slides disponibles</div>;

  return (
    <div className="carousel">
      {slides.map((slide, i) => (
        <div key={slide.Id || i} className="carousel-slide">
          <img 
            src={`http://localhost:5000${slide.Image}`} 
            alt={slide.Title} 
            onError={(e) => {
              console.error('Error cargando imagen:', e.target.src);
              e.target.style.display = 'none';
            }}
          />
          <h3>{slide.Title}</h3>
          <p>{slide.Text}</p>
        </div>
      ))}
    </div>
  );
}