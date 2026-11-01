import type { IconName } from '@/components/icons';
import type { AppointmentType } from '@/lib/appointments';

/** Lo que el cliente puede hacer desde la ficha. Las tres primeras son los botones; RESERVA es el apartado. */
export type ContactKind = AppointmentType;

export interface ContactOption {
  kind: Exclude<ContactKind, 'RESERVA'>;
  icon: IconName;
  title: string;
  /** Línea corta debajo del título en el botón. */
  hint: string;
  /** Qué pasa después de enviar, para que nadie dude. */
  help: string;
  placeholder: string;
}

export const CONTACT_OPTIONS: ContactOption[] = [
  {
    kind: 'INTERES',
    icon: 'heart',
    title: 'Estoy interesado',
    hint: 'Avísale que te gusta',
    help: 'Le llegará tu mensaje y te responderá por aquí.',
    placeholder: 'Cuéntale por qué te interesa (opcional)',
  },
  {
    kind: 'PREGUNTA',
    icon: 'help',
    title: 'Tengo una pregunta',
    hint: 'Escríbele tus dudas',
    help: 'Pregunta lo que quieras antes de decidir.',
    placeholder: 'Escribe tu pregunta',
  },
  {
    kind: 'VISITA',
    icon: 'calendar',
    title: 'Pedir una visita',
    hint: 'Él te propone fechas',
    help: 'No tienes que elegir fecha: el anunciante te propone algunas y tú aceptas la que te quede mejor.',
    placeholder: 'Cuéntale cuándo te viene bien (opcional)',
  },
];

/** El apartado no es una de las tres opciones: tiene su propia ventana. */
export const RESERVE_HELP = 'Apartar no te compromete: el anunciante confirma contigo antes de reservarla.';
