'use client';

import { useState, useRef } from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onError?: (error: string) => void;
  type?: string;
  className?: string;
  accept?: string;
  maxSize?: number; // en MB
  placeholder?: string;
}

export function ImageUpload({
  value,
  onChange,
  onError,
  type = 'carousel',
  className = '',
  accept = 'image/*',
  maxSize = 5,
  placeholder = 'Selecciona una imagen o arrastra aquí'
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string>(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    // Validaciones
    if (!file.type.startsWith('image/')) {
      onError?.('Por favor selecciona un archivo de imagen válido');
      return;
    }

    if (file.size > maxSize * 1024 * 1024) {
      onError?.(`El archivo es muy grande. Tamaño máximo: ${maxSize}MB`);
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Error al subir la imagen');
      }

      const imageUrl = result.url;
      setPreview(imageUrl);
      onChange(imageUrl);

    } catch (error) {
      console.error('Error uploading image:', error);
      onError?.(error instanceof Error ? error.message : 'Error al subir la imagen');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleRemove = () => {
    setPreview('');
    onChange('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Upload area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        {isUploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-600">Subiendo imagen...</p>
          </div>
        ) : preview ? (
          <div className="space-y-4">
            <div className="relative inline-block">
              <img
                src={preview}
                alt="Preview"
                className="max-h-48 max-w-full rounded-lg object-cover"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-gray-500">Haz clic para cambiar la imagen</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-gray-400" />
            <div>
              <p className="font-medium">{placeholder}</p>
              <p className="text-sm text-gray-500">
                JPG, PNG, WebP o GIF (máx. {maxSize}MB)
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Alternative: URL input */}
      {!preview && (
        <div className="space-y-2">
          <Label className="text-sm font-medium">O ingresa una URL:</Label>
          <div className="flex gap-2">
            <Input
              type="url"
              placeholder="https://ejemplo.com/imagen.jpg"
              value={value || ''}
              onChange={(e) => {
                const url = e.target.value;
                setPreview(url);
                onChange(url);
              }}
            />
            {value && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
