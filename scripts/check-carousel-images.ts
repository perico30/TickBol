#!/usr/bin/env bun

import { db } from '../src/lib/database';

console.log('🔍 Verificando imágenes del carrusel...\n');

async function checkCarouselImages() {
  try {
    console.log('1. Obteniendo todas las imágenes del carrusel...');
    const allImages = await db.getAllCarouselImages();

    console.log(`📊 Total de imágenes: ${allImages.length}`);

    if (allImages.length > 0) {
      console.log('\n📋 Lista de imágenes:');
      allImages.forEach((image, index) => {
        console.log(`\n   ${index + 1}. ${image.title || 'Sin título'}`);
        console.log(`      ID: ${image.id}`);
        console.log(`      URL: ${image.imageUrl}`);
        console.log(`      Activa: ${image.isActive ? '✅' : '❌'}`);
        console.log(`      Subtítulo: ${image.subtitle || 'Sin subtítulo'}`);
        console.log(`      Enlace: ${image.linkUrl || 'Sin enlace'}`);
      });
    }

    console.log('\n2. Obteniendo solo imágenes activas...');
    const activeImages = await db.getCarouselImages();
    console.log(`📊 Imágenes activas: ${activeImages.length}`);

    if (activeImages.length === 0) {
      console.log('\n⚠️  PROBLEMA: No hay imágenes marcadas como activas');
      console.log('   El carrusel solo muestra imágenes con is_active = true');
    } else {
      console.log('\n✅ Imágenes que deberían aparecer en el carrusel:');
      activeImages.forEach((image, index) => {
        console.log(`   ${index + 1}. ${image.title}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCarouselImages();
