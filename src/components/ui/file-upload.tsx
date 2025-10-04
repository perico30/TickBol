'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

interface FileUploadProps {
  accept?: string;
  maxSize?: number; // en MB
  value?: string;
  onChange: (base64: string | null) => void;
  placeholder?: string;
  preview?: boolean;
  className?: string;
}

export default function FileUpload({
  accept = "image/*",
  maxSize = 5,
  value,
  onChange,
  placeholder = "Seleccionar archivo",
  preview = true,
  className = ""
}: FileUploadProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError('');
    setLoading(true);

    try {
      // Validar tamaño
      if (file.size > maxSize * 1024 * 1024) {
        setError(`El archivo debe ser menor a ${maxSize}MB`);
        setLoading(false);
        return;
      }

      // Validar tipo
      if (accept === "image/*" && !file.type.startsWith('image/')) {
        setError('Solo se permiten imágenes');
        setLoading(false);
        return;
      }

      // Convertir a base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onChange(base64);
        setLoading(false);
      };
      reader.onerror = () => {
        setError('Error al leer el archivo');
        setLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error al procesar el archivo');
      setLoading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isImage = value && (value.startsWith('data:image/') || value.startsWith('http'));

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {!value ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400 transition-colors"
        >
          {loading ? (
            <div className="space-y-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Subiendo archivo...</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="h-8 w-8 text-gray-400 mx-auto" />
              <p className="text-sm text-gray-600">{placeholder}</p>
              <p className="text-xs text-gray-400">
                Máximo {maxSize}MB • {accept === "image/*" ? "JPG, PNG, GIF" : "Todos los tipos"}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {preview && isImage && (
            <div className="relative border rounded-lg overflow-hidden">
              <Image
                src={value}
                alt="Preview"
                width={400}
                height={300}
                className="w-full h-48 object-cover"
              />
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemove}
                className="absolute top-2 right-2"
              >
                <X size={16} />
              </Button>
            </div>
          )}

          {!isImage && (
            <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
              <div className="flex items-center gap-2">
                <ImageIcon size={16} className="text-gray-500" />
                <span className="text-sm text-gray-700">Archivo subido</span>
              </div>
              <Button size="sm" variant="outline" onClick={handleRemove}>
                <X size={16} />
              </Button>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              size="sm"
            >
              <Upload size={16} className="mr-2" />
              Cambiar Archivo
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
