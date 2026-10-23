'use client';
import './importscreen.css';
import { useImportScreen } from '../../hooks/useImportScreen';
import { ImportSteps } from './ImportSteps';
import { AgencySidebar } from '../shared/AgencySidebar';

export function ImportScreen() {
  const v = useImportScreen();
  return (
    <div
      className="ds-importscreen"
      style={{
        width: '100%',
        height: '100dvh',
        display: 'flex',
        background: 'var(--bg)',
        color: 'var(--text)',
        fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif",
        overflow: 'hidden',
      }}
    >
      <AgencySidebar active="importar" />
      <main
        style={{
          flex: '1 1 auto',
          minWidth: '0',
          display: 'flex',
          flexDirection: 'column',
          padding: '30px 48px 36px',
          gap: '26px',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h1
            style={{ margin: '0', fontSize: '32px', fontWeight: '800', letterSpacing: '-0.03em' }}
          >
            Importar propiedades desde Excel
          </h1>
          <p style={{ margin: '0', fontSize: '16px', color: 'var(--muted)' }}>
            Sube tu inventario completo de una vez. Revisamos cada fila antes de publicar nada.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <span className={v.progress1}>
            <span className="n">1</span>
            Subir archivo
          </span>
          <span style={{ flex: '0 0 60px', height: '2px', background: 'var(--line)' }} />
          <span className={v.progress2}>
            <span className="n">2</span>
            Revisar
          </span>
          <span style={{ flex: '0 0 60px', height: '2px', background: 'var(--line)' }} />
          <span className={v.progress3}>
            <span className="n">3</span>
            Importar
          </span>
        </div>
        <ImportSteps v={v} />
      </main>
    </div>
  );
}
