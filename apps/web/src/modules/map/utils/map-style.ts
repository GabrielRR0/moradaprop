import { MapLibreSupport } from '@/support/maplibre';

/**
 * Estilo del mapa: se descarga el estilo base (OpenFreeMap) y se repinta con los colores del
 * diseno (variables CSS --map-bg, --map-road, --map-park, --map-water), asi el mapa real se ve
 * igual que la ilustracion original y cambia solo con el modo noche.
 */

interface MapColors {
  bg: string;
  road: string;
  park: string;
  water: string;
  line: string;
  muted: string;
  text: string;
}

export function readMapColors(): MapColors {
  const style = getComputedStyle(document.documentElement);
  const get = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    bg: get('--map-bg', '#EEF1F6'),
    road: get('--map-road', '#FFFFFF'),
    park: get('--map-park', '#D3EBDA'),
    water: get('--map-water', '#CFE3F6'),
    line: get('--line', '#E6E9F0'),
    muted: get('--muted', '#566073'),
    text: get('--text', '#0F1420'),
  };
}

const cache = new Map<string, Promise<MapLibreSupport.StyleSpecification | null>>();

/** Descarga el estilo una sola vez; si falla devuelve null (el mapa se ve sin calles pero funciona). */
export function loadBaseStyle(url: string): Promise<MapLibreSupport.StyleSpecification | null> {
  let hit = cache.get(url);
  if (!hit) {
    hit = fetch(url)
      .then((r) => (r.ok ? (r.json() as Promise<MapLibreSupport.StyleSpecification>) : null))
      .catch(() => null);
    cache.set(url, hit);
    // Si fallo, que el siguiente intento vuelva a probar.
    void hit.then((style) => {
      if (!style) cache.delete(url);
    });
  }
  return hit;
}

export function blankStyle(colors: MapColors): MapLibreSupport.StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [{ id: 'background', type: 'background', paint: { 'background-color': colors.bg } }],
  };
}

type Layer = MapLibreSupport.StyleSpecification['layers'][number];

function recolor(layer: Layer, c: MapColors): Layer {
  const id = layer.id;
  const next = { ...layer, paint: { ...(layer.paint ?? {}) } } as Layer & {
    paint: Record<string, unknown>;
  };
  const paint = next.paint;

  if (layer.type === 'background') paint['background-color'] = c.bg;
  else if (id === 'water') paint['fill-color'] = c.water;
  else if (id === 'waterway') paint['line-color'] = c.water;
  else if (id === 'park' || id === 'landcover_wood') {
    paint['fill-color'] = c.park;
    paint['fill-opacity'] = 1;
  } else if (id === 'landuse_residential') paint['fill-color'] = c.bg;
  else if (id.startsWith('landcover_ice'))
    next.layout = { ...(next.layout ?? {}), visibility: 'none' };
  else if (id === 'building') {
    paint['fill-color'] = c.line;
    paint['fill-opacity'] = 0.55;
  } else if (layer.type === 'line' && /casing/.test(id)) paint['line-opacity'] = 0;
  else if (layer.type === 'line' && /^(highway|road|tunnel)/.test(id)) {
    paint['line-color'] = c.road;
    paint['line-opacity'] = 1;
  } else if (layer.type === 'line' && /railway/.test(id)) {
    paint['line-color'] = c.line;
    paint['line-opacity'] = 0.7;
  } else if (layer.type === 'line' && /boundary/.test(id)) {
    paint['line-color'] = c.muted;
    paint['line-opacity'] = 0.5;
  } else if (layer.type === 'fill' && /aeroway/.test(id)) paint['fill-color'] = c.line;
  else if (layer.type === 'symbol') {
    paint['text-color'] = id.startsWith('label_') ? c.text : c.muted;
    paint['text-halo-color'] = c.bg;
    paint['text-halo-width'] = 1.6;
    paint['text-halo-blur'] = 0.4;
  }
  return next;
}

/** Estilo base repintado con los colores del diseno. */
export function themedStyle(base: MapLibreSupport.StyleSpecification): MapLibreSupport.StyleSpecification {
  const colors = readMapColors();
  return { ...base, layers: base.layers.map((layer) => recolor(layer, colors)) };
}
