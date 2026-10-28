'use client';

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { publicEnv } from '@/config';
import { toast } from '@/lib/toast';
import type { Bounds, ClusterMarker, MapMarker, MapView } from '@/lib/properties';
import { blankStyle, loadBaseStyle, readMapColors, themedStyle } from '../../utils/map-style';
import { VENEZUELA_BOUNDS } from '../../utils/places';
import { ClusterButton, PinButton } from './MapPins';
import './mapcanvas.css';
import { MapLibreSupport } from '@/support/maplibre';

export interface ViewportInfo {
  bounds: Bounds;
  zoom: number;
  center: { lat: number; lng: number };
}

export interface MapHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  locate: () => void;
  /** Vuela a una vista; `offset` desplaza el punto respecto al centro (para dejar sitio a la ficha). */
  flyTo: (view: MapView, offset?: [number, number]) => void;
  getZoom: () => number;
}

export interface MapPopup {
  lat: number;
  lng: number;
  content: ReactNode;
}

interface MapCanvasProps {
  markers: MapMarker[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onViewport: (info: ViewportInfo) => void;
  initialView: MapView;
  /** Cambia con el modo noche: el mapa se repinta con los colores del tema. */
  dark: boolean;
  /** true = estilo con mas detalle (boton "tipo de mapa"). */
  detail: boolean;
  popup?: MapPopup | null;
  onStatus?: (status: 'ready' | 'offline') => void;
  style?: CSSProperties;
}

interface Entry {
  key: string;
  el: HTMLDivElement;
  data: MapMarker;
}

const markerKey = (m: MapMarker) =>
  m.kind === 'point'
    ? `p:${m.id}`
    : `c:${m.latitude.toFixed(4)}:${m.longitude.toFixed(4)}:${m.count}`;

function hostElement(): HTMLDivElement {
  const el = document.createElement('div');
  el.className = 'mc-host';
  return el;
}

/** Mapa real (MapLibre) de Venezuela con los pines y la ficha flotante del diseno encima. */
export const MapCanvas = forwardRef<MapHandle, MapCanvasProps>(function MapCanvas(props, ref) {
  const {
    markers,
    selectedId,
    onSelect,
    onViewport,
    initialView,
    dark,
    detail,
    popup,
    onStatus,
    style,
  } = props;
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreSupport.Map | null>(null);
  const libRef = useRef<MapLibreSupport.Library | null>(null);
  const recordsRef = useRef(new Map<string, { marker: MapLibreSupport.Marker; el: HTMLDivElement }>());
  const popupRef = useRef<{ marker: MapLibreSupport.Marker; el: HTMLDivElement } | null>(null);
  const meRef = useRef<{ marker: MapLibreSupport.Marker; el: HTMLDivElement } | null>(null);
  const latest = useRef({ onViewport, onStatus, initialView, detail, onSelect });
  latest.current = { onViewport, onStatus, initialView, detail, onSelect };

  const [ready, setReady] = useState(false);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [popupHost, setPopupHost] = useState<HTMLDivElement | null>(null);
  const [meHost, setMeHost] = useState<HTMLDivElement | null>(null);

  const styleFor = async (isDetail: boolean) => {
    const base = await loadBaseStyle(
      isDetail ? publicEnv.mapDetailStyleUrl : publicEnv.mapStyleUrl,
    );
    if (!base) {
      latest.current.onStatus?.('offline');
      return blankStyle(readMapColors());
    }
    latest.current.onStatus?.('ready');
    return isDetail ? base : themedStyle(base);
  };

  const emitViewport = (map: MapLibreSupport.Map) => {
    const b = map.getBounds();
    const c = map.getCenter();
    latest.current.onViewport({
      bounds: { swLat: b.getSouth(), swLng: b.getWest(), neLat: b.getNorth(), neLng: b.getEast() },
      zoom: map.getZoom(),
      center: { lat: c.lat, lng: c.lng },
    });
  };

  // ---- Crear el mapa (una sola vez) ----
  useEffect(() => {
    let cancelled = false;
    let map: MapLibreSupport.Map | null = null;
    let observer: ResizeObserver | null = null;

    (async () => {
      const [lib, firstStyle] = await Promise.all([
        MapLibreSupport.load(),
        styleFor(latest.current.detail),
      ]);
      if (cancelled || !containerRef.current) return;
      lib.setWorkerUrl('/maplibre/maplibre-gl-worker.mjs');
      libRef.current = lib;
      const view = latest.current.initialView;
      map = new lib.Map({
        container: containerRef.current,
        style: firstStyle,
        center: [view.lng, view.lat],
        zoom: view.zoom,
        minZoom: 4.6,
        maxZoom: 18,
        maxBounds: VENEZUELA_BOUNDS,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
      });
      map.touchZoomRotate.disableRotation();
      map.addControl(new lib.AttributionControl({ compact: true }), 'top-left');
      map.on('moveend', () => map && emitViewport(map));
      map.on('click', () => latest.current.onSelect(null));
      map.once('load', () => {
        if (!map) return;
        mapRef.current = map;
        setReady(true);
        emitViewport(map);
      });
      observer = new ResizeObserver(() => map?.resize());
      observer.observe(containerRef.current);
    })();

    const records = recordsRef.current;
    return () => {
      cancelled = true;
      observer?.disconnect();
      records.forEach((r) => r.marker.remove());
      records.clear();
      popupRef.current?.marker.remove();
      meRef.current?.marker.remove();
      map?.remove();
      mapRef.current = null;
      setReady(false);
    };
  }, []);

  // ---- Repintar al cambiar modo noche o tipo de mapa ----
  const firstStyleRun = useRef(true);
  useEffect(() => {
    if (firstStyleRun.current) {
      firstStyleRun.current = false;
      return;
    }
    const map = mapRef.current;
    if (!map) return;
    void styleFor(detail).then((next) => mapRef.current && mapRef.current.setStyle(next));
  }, [dark, detail]);

  // ---- Pines y grupos ----
  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!ready || !map || !lib) return;
    const wanted = new Map(markers.map((m) => [markerKey(m), m]));
    const records = recordsRef.current;

    for (const [key, rec] of records) {
      if (!wanted.has(key)) {
        rec.marker.remove();
        records.delete(key);
      }
    }
    for (const [key, data] of wanted) {
      if (records.has(key)) continue;
      const el = hostElement();
      const marker = new lib.Marker({ element: el, anchor: 'center' })
        .setLngLat([data.longitude, data.latitude])
        .addTo(map);
      records.set(key, { marker, el });
    }
    setEntries(
      [...records].map(([key, rec]) => ({ key, el: rec.el, data: wanted.get(key) as MapMarker })),
    );
  }, [markers, ready]);

  // El pin seleccionado queda por encima de los demas.
  useEffect(() => {
    recordsRef.current.forEach((rec, key) => {
      rec.marker.getElement().style.zIndex = key === `p:${selectedId}` ? '6' : '';
    });
  }, [selectedId, entries]);

  // ---- Ficha flotante anclada a la propiedad elegida ----
  const popupLat = popup?.lat;
  const popupLng = popup?.lng;
  useEffect(() => {
    const map = mapRef.current;
    const lib = libRef.current;
    if (!ready || !map || !lib) return;
    if (popupLat === undefined || popupLng === undefined) {
      popupRef.current?.marker.remove();
      popupRef.current = null;
      setPopupHost(null);
      return;
    }
    if (!popupRef.current) {
      const el = hostElement();
      el.style.zIndex = '10';
      popupRef.current = {
        marker: new lib.Marker({ element: el, anchor: 'center' })
          .setLngLat([popupLng, popupLat])
          .addTo(map),
        el,
      };
      setPopupHost(el);
    } else {
      popupRef.current.marker.setLngLat([popupLng, popupLat]);
    }
  }, [popupLat, popupLng, ready]);

  // ---- Control desde fuera (botones de zoom, ubicacion, buscador) ----
  useImperativeHandle(ref, () => ({
    zoomIn: () => mapRef.current?.zoomIn({ duration: 250 }),
    zoomOut: () => mapRef.current?.zoomOut({ duration: 250 }),
    getZoom: () => mapRef.current?.getZoom() ?? 0,
    flyTo: (view, offset) =>
      mapRef.current?.flyTo({
        center: [view.lng, view.lat],
        zoom: view.zoom,
        offset: offset ?? [0, 0],
        speed: 1.4,
        essential: true,
      }),
    locate: () => {
      if (!navigator.geolocation) return toast('Tu navegador no permite ubicarte', 'warn');
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const map = mapRef.current;
          const lib = libRef.current;
          if (!map || !lib) return;
          if (!meRef.current) {
            const el = hostElement();
            meRef.current = {
              marker: new lib.Marker({ element: el })
                .setLngLat([coords.longitude, coords.latitude])
                .addTo(map),
              el,
            };
            setMeHost(el);
          } else meRef.current.marker.setLngLat([coords.longitude, coords.latitude]);
          map.flyTo({ center: [coords.longitude, coords.latitude], zoom: 14.5, essential: true });
        },
        () => toast('No pudimos obtener tu ubicación. Revisa el permiso del navegador.', 'warn'),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    },
  }));

  const zoomIntoCluster = (m: ClusterMarker) => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({
      center: [m.longitude, m.latitude],
      zoom: Math.min(map.getZoom() + 2.2, 17.5),
      duration: 600,
    });
  };

  return (
    <div className="mc-wrap" style={style}>
      <div ref={containerRef} className="mc-map" />
      {!ready && <div className="mc-loading" aria-hidden="true" />}
      {entries.map(({ key, el, data }) =>
        createPortal(
          data.kind === 'point' ? (
            <PinButton marker={data} selected={data.id === selectedId} onSelect={onSelect} />
          ) : (
            <ClusterButton marker={data} onZoom={zoomIntoCluster} />
          ),
          el,
          key,
        ),
      )}
      {popupHost && popup && createPortal(popup.content, popupHost)}
      {meHost && createPortal(<span className="mc-me" aria-label="Tu ubicación" />, meHost)}
    </div>
  );
});
