'use client';

import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Button, Notice } from '@/components/ui';
import { toast } from '@/lib/toast';
import { MotionSupport } from '@/support/motion';

/**
 * Los codigos de respaldo se muestran UNA sola vez: no se guardan en el navegador y no se pueden
 * volver a ver (solo regenerar). Por eso no deja continuar hasta que el usuario confirme que los guardo.
 */
export function BackupCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const [saved, setSaved] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(codes.join('\n'));
      toast('Códigos copiados');
    } catch {
      toast('No pudimos copiarlos. Descárgalos.', 'warn');
    }
  }

  function download() {
    const blob = new Blob([`Códigos de respaldo (cada uno sirve una sola vez)\n\n${codes.join('\n')}\n`], {
      type: 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'codigos-de-respaldo.txt';
    link.click();
    URL.revokeObjectURL(url);
    setSaved(true);
  }

  return (
    <div className="sc-qr" style={{ alignItems: 'stretch', gap: 16 }}>
      <Notice tone="warn">
        Guárdalos ahora: son tu salvavidas si pierdes el teléfono. <b>No podrás volver a verlos.</b>
      </Notice>
      <div className="sc-codes" role="list" aria-label="Códigos de respaldo">
        {codes.map((code, index) => (
          <MotionSupport.motion.span
            key={code}
            role="listitem"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.04 * index }}
          >
            {code}
          </MotionSupport.motion.span>
        ))}
      </div>
      <div className="sc-actions">
        <Button variant="secondary" size="sm" onClick={copy}>
          <Icon name="copy" size={16} /> Copiar
        </Button>
        <Button variant="secondary" size="sm" onClick={download}>
          <Icon name="download" size={16} /> Descargar
        </Button>
      </div>
      <label className="sc-check">
        <input type="checkbox" checked={saved} onChange={(event) => setSaved(event.target.checked)} />
        Ya los guardé en un lugar seguro
      </label>
      <Button block disabled={!saved} onClick={onDone}>
        Continuar
      </Button>
    </div>
  );
}
