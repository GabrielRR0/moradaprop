'use client';
import './inventoryscreen.css';
import { useInventoryScreen } from '../../hooks/useInventoryScreen';
import { InventoryMain } from './InventoryMain';
import { AgencySidebar } from '../shared/AgencySidebar';

export function InventoryScreen() {
  const v = useInventoryScreen();
  return (
    <div
      className="ds-inventoryscreen"
      style={{
        position: 'relative',
        width: '100%',
        height: '100dvh',
        display: 'flex',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
        overflow: 'hidden',
      }}
    >
      <AgencySidebar active="propiedades" />
      <InventoryMain v={v} />
    </div>
  );
}
