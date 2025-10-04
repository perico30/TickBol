'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CarouselImage } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CarouselProps {
  images: CarouselImage[];
  autoRotate?: boolean;
  interval?: number;
}

export default function Carousel({ images, autoRotate = true, interval = 2000 }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto rotation
  useEffect(() => {
    if (!autoRotate || images.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      );
    }, interval);

    return () => clearInterval(timer);
  }, [autoRotate, interval, images.length]);

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1);
  };

  const goToNext = () => {
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (images.length === 0) {
    return (
      <div className="relative h-96 bg-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            EventosDiscos
          </h1>
          <p className="text-xl text-gray-300">
            La mejor plataforma para eventos de discotecas
          </p>
        </div>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className="relative h-96 md:h-[500px] overflow-hidden">
      {/* Main Image */}
      <div className="relative h-full">
        <Image
          src={currentImage.url}
          alt={currentImage.title}
          fill
          className="object-cover transition-opacity duration-500"
          priority={currentIndex === 0}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center">
          <div className="container mx-auto px-4 text-white">
            <div className="max-w-2xl">
              <h1 className="text-4xl md:text-6xl font-bold mb-4">
                {currentImage.title}
              </h1>
              {currentImage.subtitle && (
                <p className="text-xl md:text-2xl mb-6 text-gray-200">
                  {currentImage.subtitle}
                </p>
              )}
              {currentImage.link && (
                <a
                  href={currentImage.link}
                  className="bg-white text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
                >
                  Ver Más
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
            aria-label="Imagen anterior"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            onClick={goToNext}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all"
            aria-label="Siguiente imagen"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Dots Indicator */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-white'
                  : 'bg-white bg-opacity-50 hover:bg-opacity-75'
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
