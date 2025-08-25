import React, { useState, useEffect, } from "react";
import styles from "../Style/carousel.module.css";

const Carousel = ({ slides }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Cambia cada 7 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      goToNext();
    }, 7000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    setCurrentIndex(isFirstSlide ? slides.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === slides.length - 1;
    setCurrentIndex(isLastSlide ? 0 : currentIndex + 1);
  };

  return (
    <div className={styles.carousel}>
      <div
        className={styles.slide}
        style={{ backgroundImage: `url(${slides[currentIndex].image})` }}
      >
        <div className={styles.overlay}>
          <h2>{slides[currentIndex].title}</h2>
          <p>{slides[currentIndex].text}</p>
        </div>
      </div>

      <button className={styles.prev} onClick={goToPrevious}>‹</button>
      <button className={styles.next} onClick={goToNext}>›</button>
    </div>
  );
};

export default Carousel;
