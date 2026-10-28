'use client';

import { Icon } from '@/components/icons';
import { Button } from '@/components/ui';
import { MotionSupport } from '@/support/motion';

/** Texto corto de un user-agent: "Chrome en Windows". */
export function describeAgent(userAgent: string | null): string {
  if (!userAgent) return 'Dispositivo desconocido';
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Navegador';
  const os = /Windows/.test(userAgent)
    ? 'Windows'
    : /Android/.test(userAgent)
      ? 'Android'
      : /iPhone|iPad/.test(userAgent)
        ? 'iOS'
        : /Mac OS/.test(userAgent)
          ? 'macOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : '';
  return os ? `${browser} en ${os}` : browser;
}

/** Fila de una lista de dispositivos o sesiones: entra y sale animada al agregarse o quitarse. */
export function DeviceRow({
  icon,
  title,
  meta,
  current,
  tag,
  onRemove,
  removeLabel,
}: {
  icon: 'monitor' | 'smartphone';
  title: string;
  meta: string;
  current: boolean;
  tag?: string;
  onRemove: () => void;
  removeLabel: string;
}) {
  return (
    <MotionSupport.motion.li
      className="sc-item"
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -30 }}
    >
      <span className={current ? 'ico ok' : 'ico'}>
        <Icon name={icon} size={22} />
      </span>
      <span className="txt">
        <b>
          {title}
          {current && <span className="sc-tag">Este dispositivo</span>}
          {tag && <span className="sc-tag">{tag}</span>}
        </b>
        <span>{meta}</span>
      </span>
      <Button variant="secondary" size="sm" onClick={onRemove}>
        {removeLabel}
      </Button>
    </MotionSupport.motion.li>
  );
}
