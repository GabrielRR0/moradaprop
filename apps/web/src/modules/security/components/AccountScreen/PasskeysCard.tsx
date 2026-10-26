'use client';

import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useState, type FormEvent } from 'react';
import { Icon } from '@/components/icons';
import { Button, Field, Notice, Sheet } from '@/components/ui';
import type { Passkey } from '@/lib/api-types';
import { toast } from '@/lib/toast';
import { passkeysSupported } from '@/modules/auth';
import { useAction } from '../../hooks/useAction';
import { securityKeys, usePasskeys, useRefreshing } from '../../hooks/useSecurityData';
import { securityService } from '../../services/security.service';
import { timeAgo } from '../../services/event-copy';
import { Card, ConfirmSheet, ListState } from '../shared/Card';
import { PasskeyAddForm } from '../shared/PasskeyAddForm';

function RenameSheet({ passkey, onClose }: { passkey: Passkey | null; onClose: () => void }) {
  const [label, setLabel] = useState('');
  const action = useAction();
  const rename = useRefreshing((value: { id: string; label: string }) => securityService.renamePasskey(value.id, value.label), securityKeys.passkeys);
  useEffect(() => setLabel(passkey?.label ?? ''), [passkey]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!passkey || !label.trim()) return;
    const ok = await action.run(async () => {
      await rename.mutateAsync({ id: passkey.id, label: label.trim() });
      return true;
    });
    if (ok) {
      toast('Nombre actualizado');
      onClose();
    }
  }

  return (
    <Sheet open={Boolean(passkey)} onClose={onClose} title="Cambiar nombre">
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
        <Notice tone="error" show={Boolean(action.problem)}>
          {action.problem?.text}
        </Notice>
        <Field label="Nombre" value={label} onChange={setLabel} maxLength={60} autoFocus />
        <Button type="submit" block loading={action.pending} disabled={!label.trim()}>
          Guardar
        </Button>
      </form>
    </Sheet>
  );
}

/** Mis passkeys: agregar, renombrar y quitar. Conviene tener al menos dos metodos. */
export function PasskeysCard({ index }: { index: number }) {
  const query = usePasskeys();
  const [adding, setAdding] = useState(false);
  const [renaming, setRenaming] = useState<Passkey | null>(null);
  const [removing, setRemoving] = useState<Passkey | null>(null);
  const [supported, setSupported] = useState(false);
  const remove = useRefreshing(securityService.removePasskey, securityKeys.passkeys);
  useEffect(() => setSupported(passkeysSupported()), []);

  const items = query.data ?? [];
  return (
    <Card
      index={index}
      title="Huella, Face ID y passkeys"
      lead="Entra con tu huella, tu cara o el PIN del dispositivo. Nadie puede copiarlas."
      action={
        supported ? (
          <Button size="sm" onClick={() => setAdding(true)}>
            <Icon name="plus" size={16} /> Agregar
          </Button>
        ) : undefined
      }
    >
      {!supported && <Notice tone="info">Este navegador no admite passkeys.</Notice>}
      <ListState
        loading={query.isLoading}
        error={query.isError}
        onRetry={() => query.refetch()}
        empty={items.length === 0 ? 'Aún no tienes passkeys. Agrega la primera: es lo más seguro y rápido.' : undefined}
      >
        <ul className="sc-list">
          <AnimatePresence initial={false}>
            {items.map((passkey) => (
              <motion.li
                key={passkey.id}
                className="sc-item"
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, x: -30 }}
              >
                <span className="ico">
                  <Icon name="fingerprint" size={22} />
                </span>
                <span className="txt">
                  <b>
                    {passkey.label || 'Passkey sin nombre'}
                    {passkey.backedUp && <span className="sc-tag">Sincronizada</span>}
                  </b>
                  <span>
                    {passkey.lastUsedAt ? `Último uso ${timeAgo(passkey.lastUsedAt)}` : 'Sin usar todavía'}
                  </span>
                </span>
                <Button variant="secondary" size="sm" label="Cambiar nombre" onClick={() => setRenaming(passkey)}>
                  <Icon name="pencil" size={16} />
                </Button>
                <Button variant="secondary" size="sm" label="Quitar passkey" onClick={() => setRemoving(passkey)}>
                  <Icon name="close" size={16} />
                </Button>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </ListState>
      {items.length === 1 && (
        <Notice tone="info">Agrega un segundo método por si pierdes este dispositivo.</Notice>
      )}

      <Sheet open={adding} onClose={() => setAdding(false)} title="Agregar huella / Face ID">
        <PasskeyAddForm onAdded={() => setAdding(false)} />
      </Sheet>
      <RenameSheet passkey={renaming} onClose={() => setRenaming(null)} />
      <ConfirmSheet
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        title="¿Quitar esta passkey?"
        text="Ya no podrás entrar con ella. Debes hacerlo desde un dispositivo de confianza."
        confirmLabel="Quitar"
        danger
        onConfirm={async () => {
          if (removing) await remove.mutateAsync(removing.id);
          toast('Passkey quitada');
        }}
      />
    </Card>
  );
}
