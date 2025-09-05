import React, { useState, useEffect } from "react";
import styles from "../Style/carousel.module.css";

const Carousel = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Solo ejecutar si hay slides
  useEffect(() => {
    if (!slides || slides.length === 0) return;
    
    const interval = setInterval(() => {
      goToNext();
    }, 7000);
    return () => clearInterval(interval);
  }, [currentIndex, slides]);

  const goToPrevious = () => {
    if (!slides || slides.length === 0) return;
    const isFirstSlide = currentIndex === 0;
    setCurrentIndex(isFirstSlide ? slides.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    if (!slides || slides.length === 0) return;
    const isLastSlide = currentIndex === slides.length - 1;
    setCurrentIndex(isLastSlide ? 0 : currentIndex + 1);
  };

  // Si no hay slides, mostrar loading o mensaje
  if (!slides || slides.length === 0) {
    return <div className={styles.carousel}>Cargando slides...</div>;
  }

  const currentSlide = slides[currentIndex];

  return (
    <div className={styles.carousel}>
      <div
        className={styles.slide}
        style={{ backgroundImage: `url(http://localhost:5000${currentSlide.Image})` }}
      >
        <div className={styles.overlay}>
          <h2>{currentSlide.Title}</h2>
          <p>{currentSlide.Text}</p>
        </div>
      </div>

      <button className={styles.prev} onClick={goToPrevious}>‹</button>
      <button className={styles.next} onClick={goToNext}>›</button>
    </div>
  );
};

export default Carousel;