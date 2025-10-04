import Image from 'next/image';
import Link from 'next/link';
import { Event } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users } from 'lucide-react';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const soldPercentage = event.maxCapacity
    ? Math.round((event.currentSales || 0) / event.maxCapacity * 100)
    : 0;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 group">
      <div className="relative">
        <div className="aspect-[4/3] relative overflow-hidden">
          <Image
            src={event.image}
            alt={event.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="absolute top-4 left-4">
          <Badge variant="secondary" className="bg-white/90 text-gray-800">
            Bs. {event.price}
          </Badge>
        </div>
        {soldPercentage > 80 && (
          <div className="absolute top-4 right-4">
            <Badge variant="destructive">
              ¡Últimas entradas!
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
          {event.title}
        </h3>

        <div className="space-y-2 text-sm text-gray-600 mb-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{formatDate(event.date)} - {event.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>{event.location}, {event.city}</span>
          </div>
          {event.maxCapacity && (
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>{event.currentSales || 0} / {event.maxCapacity} vendidos</span>
            </div>
          )}
        </div>

        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            por {event.businessName}
          </div>
          <Link
            href={`/evento/${event.id}`}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Ver Más
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
