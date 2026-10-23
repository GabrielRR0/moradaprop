import { useState } from 'react';
import { classIf } from '@/lib/classes';
import { toast } from '@/lib/toast';
import { findAgent, PROPERTIES, PROPERTY_STATUSES } from './agency-data';
import { badgeStyle, photoTint } from './agency-style';

const ALL_TABS = 'Todas';

/**
 * Lista de propiedades de la inmobiliaria, compartida por escritorio y teléfono
 * (`tabClass` es la clase de las pestañas: "tab" en escritorio, "chip" en teléfono):
 * pestañas por estado, cambio de estado con un toque y las filas ya listas para dibujar.
 */
export function useInventoryList(tabClass: string) {
  const [properties, setProperties] = useState(PROPERTIES);
  const [activeTab, setActiveTab] = useState(ALL_TABS);

  // Pasa la propiedad al siguiente estado: Publicada -> Reservada -> Alquilada -> Pausada -> Publicada
  function changeStatus(propertyId: number) {
    const current = properties.find((p) => p.id === propertyId);
    if (!current) return;
    const position = PROPERTY_STATUSES.findIndex((s) => s.name === current.status);
    const next = PROPERTY_STATUSES[(position + 1) % PROPERTY_STATUSES.length].name;
    setProperties(properties.map((p) => (p.id === propertyId ? { ...p, status: next } : p)));
    toast(`Estado cambiado a ${next}`);
  }

  const tabNames = [ALL_TABS, ...PROPERTY_STATUSES.map((s) => s.name)];
  const tabs = tabNames.map((name) => ({
    name,
    count:
      name === ALL_TABS ? properties.length : properties.filter((p) => p.status === name).length,
    className: classIf(tabClass, name === activeTab),
    choose: () => setActiveTab(name),
  }));

  const visibleProperties = properties.filter(
    (p) => activeTab === ALL_TABS || p.status === activeTab,
  );

  const rows = visibleProperties.map((property, index) => {
    const agent = findAgent(property.agentId);
    const statusColor =
      PROPERTY_STATUSES.find((s) => s.name === property.status)?.color ?? '#6B7488';
    return {
      id: property.id,
      title: property.title,
      code: property.code,
      place: property.place,
      price: property.price,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      views: property.views,
      messages: property.messages,
      status: property.status,
      statusStyle: badgeStyle(statusColor),
      agent: agent.name,
      agentInitials: agent.initials,
      agentColor: agent.color,
      tint: photoTint(10 + ((property.id * 4) % 20)),
      delay: `${index * 45}ms`,
      changeStatus: () => changeStatus(property.id),
    };
  });

  return { tabs, rows, visibleIds: visibleProperties.map((p) => p.id) };
}
