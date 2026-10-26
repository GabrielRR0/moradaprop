'use client';

import Link from 'next/link';
import { Icon } from '@/components/icons';
import { useSession } from '@/modules/auth';
import { timeLeft } from '../../services/deadline';
import { Card } from '../shared/Card';

/** Resumen: ¿esta cuenta ya tiene un segundo paso? Si falta, lleva a activarlo. */
export function FactorStatusCard({ index }: { index: number }) {
  const { enrollment } = useSession();
  const protectedAccount = Boolean(enrollment?.hasFactor);
  const left = enrollment?.graceEndsAt ? timeLeft(enrollment.graceEndsAt) : null;

  return (
    <Card index={index} title="Verificación en dos pasos">
      <div className="sc-status">
        <span className={protectedAccount ? 'badge ok' : 'badge'}>
          <Icon name={protectedAccount ? 'shield' : 'alert'} size={28} />
        </span>
        <div>
          <b>{protectedAccount ? 'Tu cuenta está protegida' : 'Aún no está activada'}</b>
          <span>
            {protectedAccount
              ? 'Entras con passkey o con un código extra desde sitios nuevos.'
              : enrollment?.required && left && !left.expired
                ? `Es obligatoria en tu cuenta. Te quedan ${left.text}.`
                : enrollment?.required
                  ? 'Es obligatoria en tu cuenta: actívala ahora.'
                  : 'Te recomendamos activarla para que nadie entre solo con tu contraseña.'}
          </span>
        </div>
      </div>
      {!protectedAccount && (
        <Link href="/seguridad/activar" className="ui-btn block">
          Activar ahora
        </Link>
      )}
    </Card>
  );
}
