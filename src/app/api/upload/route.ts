import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;
    const type: string = data.get('type') as string || 'carousel';

    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Tipo de archivo no permitido. Solo se permiten imágenes (JPG, PNG, WebP, GIF)'
      }, { status: 400 });
    }

    // Validar tamaño (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({
        error: 'Archivo muy grande. Tamaño máximo: 5MB'
      }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Crear nombre único para el archivo
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `${type}_${timestamp}_${randomString}.${fileExtension}`;

    // Crear directorio si no existe
    const uploadDir = join(process.cwd(), 'public', 'uploads', type);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Guardar archivo
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Retornar URL pública
    const publicUrl = `/uploads/${type}/${fileName}`;

    return NextResponse.json({
      message: 'Archivo subido exitosamente',
      url: publicUrl,
      fileName: fileName
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({
      error: 'Error interno del servidor'
    }, { status: 500 });
  }
}
