import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { classIf } from '@/lib/classes';
import { toast } from '@/lib/toast';
import { AMENITIES, LAST_STEP, PROPERTY_TYPES } from './publish-data';

/** Cuadritos de foto de ejemplo (la primera es la portada). `tintStep` cambia el tono de cada una. */
export function makePhotoTiles(count: number, tintStep: number) {
  return Array.from({ length: count }, (_, index) => ({
    caption: index === 0 ? 'Portada' : String(index + 1),
    delay: `${index * 80}ms`,
    tint: `background:color-mix(in srgb, var(--ac) ${12 + index * tintStep}%, var(--surf2))`,
  }));
}

/**
 * Lógica del formulario de publicar, compartida por escritorio y teléfono:
 * en qué paso va y lo que la persona fue eligiendo.
 */
export function usePublishForm() {
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [typeName, setTypeName] = useState('Apartamento');
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [parkingSpots, setParkingSpots] = useState(1);
  const [price, setPrice] = useState('450');
  const [amenityIds, setAmenityIds] = useState(['generator', 'fiber']);

  function toggleAmenity(id: string) {
    if (amenityIds.includes(id)) setAmenityIds(amenityIds.filter((other) => other !== id));
    else setAmenityIds([...amenityIds, id]);
  }

  function goNext() {
    if (step < LAST_STEP) {
      setStep(step + 1);
      return;
    }
    // Último paso: se envía a revisión y se va al inventario.
    toast('¡Propiedad enviada a revisión!');
    setTimeout(() => router.push('/panel/propiedades'), 900);
  }

  function goBack() {
    setStep(Math.max(1, step - 1));
  }

  function onPriceChange(event: ChangeEvent<HTMLInputElement>) {
    setPrice(event.target.value);
  }

  // Qué tan completo está el anuncio (sube con cada paso y con cada servicio).
  const quality = Math.min(100, 10 + (step - 1) * 15 + amenityIds.length * 3);

  return {
    step,
    showTypeStep: step === 1,
    showLocationStep: step === 2,
    showDetailsStep: step === 3,
    showAmenitiesStep: step === 4,
    showPhotosStep: step === 5,
    showPriceStep: step === 6,

    typeCards: PROPERTY_TYPES.map((type) => ({
      name: type.name,
      icon: type.icon,
      className: classIf('tile', type.name === typeName),
      choose: () => setTypeName(type.name),
    })),

    counters: [
      {
        label: 'Habitaciones',
        value: bedrooms,
        increase: () => setBedrooms(bedrooms + 1),
        decrease: () => setBedrooms(Math.max(0, bedrooms - 1)),
      },
      {
        label: 'Baños',
        value: bathrooms,
        increase: () => setBathrooms(bathrooms + 1),
        decrease: () => setBathrooms(Math.max(1, bathrooms - 1)),
      },
      {
        label: 'Puestos de estacionamiento',
        value: parkingSpots,
        increase: () => setParkingSpots(parkingSpots + 1),
        decrease: () => setParkingSpots(Math.max(0, parkingSpots - 1)),
      },
    ],

    amenityCards: AMENITIES.map((amenity) => ({
      name: amenity.name,
      hint: amenity.hint,
      icon: amenity.icon,
      className: classIf('amen', amenityIds.includes(amenity.id)),
      toggle: () => toggleAmenity(amenity.id),
    })),

    // Datos para la vista previa del anuncio
    typeName,
    bedrooms,
    bathrooms,
    parkingSpots,
    chosenAmenities: AMENITIES.filter((a) => amenityIds.includes(a.id)).map((a) => ({
      name: a.name,
    })),

    price,
    onPriceChange,
    quality,

    goNext,
    goBack,
    goToStep: (number: number) => setStep(number),
  };
}
