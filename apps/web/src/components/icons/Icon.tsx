import type { CSSProperties } from 'react';
import { ICON_PATHS, type IconName } from './paths';

interface IconProps {
  /** Lado en px (el icono es cuadrado). */
  size?: number;
  /** Grosor del trazo. */
  strokeWidth?: number;
  /** "none" = solo contorno; "currentColor" = relleno del color del texto. */
  fill?: string;
  style?: CSSProperties;
}

type NamedIconProps = IconProps & { name: IconName; d?: never };
type PathIconProps = IconProps & { d: string; name?: never };

/**
 * Icono de trazo (cuadricula 24x24) que toma el color del texto que lo rodea.
 *   <Icon name="home" size={20} />        -> icono del catalogo (ver paths.tsx)
 *   <Icon d={item.iconPath} />            -> icono cuyo dibujo viene en los datos
 */
export function Icon({
  name,
  d,
  size = 24,
  strokeWidth = 2.2,
  fill = 'none',
  style,
}: NamedIconProps | PathIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {name ? ICON_PATHS[name] : <path d={d} />}
    </svg>
  );
}
