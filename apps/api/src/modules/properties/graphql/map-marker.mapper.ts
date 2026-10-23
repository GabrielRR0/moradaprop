import type { MapMarker } from '../utils/clusters';
import type { MapMarkerType } from './property.types';

/** Aplana el marcador (punto | grupo) a la forma unica que expone GraphQL. */
export function toGraphqlMarker(marker: MapMarker): MapMarkerType {
  if (marker.kind === 'cluster') {
    return {
      kind: 'cluster',
      latitude: marker.latitude,
      longitude: marker.longitude,
      count: marker.count,
      minPrice: marker.minPrice,
      ids: marker.ids,
    };
  }
  const { point } = marker;
  return {
    kind: 'point',
    latitude: point.latitude,
    longitude: point.longitude,
    propertyId: point.id,
    priceAmount: point.priceAmount,
    currency: point.currency as MapMarkerType['currency'],
    status: point.status as MapMarkerType['status'],
  };
}
