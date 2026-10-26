'use client';

import { motion } from 'motion/react';
import { Icon } from '@/components/icons';
import { Button } from '@/components/ui';
import { ROLES } from '../../hooks/register-data';
import type { RegisterFlow } from '../../hooks/useRegisterFlow';

/** Paso 1: que quiere hacer el usuario. Las tarjetas entran en cascada y la elegida se marca. */
export function RegisterRoleStep({ flow }: { flow: RegisterFlow }) {
  return (
    <div className="au-col">
      <div>
        <h1 className="au-title">Crea tu cuenta</h1>
        <p className="au-sub">Cuéntanos qué quieres hacer. Siempre podrás cambiarlo después.</p>
      </div>
      <div className="au-col" style={{ gap: 12 }}>
        {ROLES.map((role, index) => (
          <motion.button
            key={role.id}
            type="button"
            className={role.id === flow.roleId ? 'au-choice on' : 'au-choice'}
            onClick={() => flow.setRoleId(role.id)}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index, duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            whileTap={{ scale: 0.98 }}
            aria-pressed={role.id === flow.roleId}
          >
            <span className="ico">
              <Icon d={role.icon} size={24} strokeWidth={2} />
            </span>
            <span className="txt">
              <b>{role.title}</b>
              <span>{role.description}</span>
            </span>
            <span className="radio">
              <Icon name="check" size={13} strokeWidth={3.4} />
            </span>
          </motion.button>
        ))}
      </div>
      <Button block onClick={flow.goData}>
        Continuar <Icon name="arrow-right" size={20} strokeWidth={2.6} />
      </Button>
    </div>
  );
}
