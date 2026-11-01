'use client';
import { Icon } from '@/components/icons';
import type { ReplyTemplate } from '@/lib/reply-templates';
import { MotionSupport } from '@/support/motion';

/** Un texto en la lista: título, vista previa y si es privado o del equipo. Al tocarlo se llama `onPick`. */
function Card({ item, index, onPick, hint }: { item: ReplyTemplate; index: number; onPick: (item: ReplyTemplate) => void; hint?: string }) {
  return (
    <MotionSupport.motion.li initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index, 8) * 0.03 }}>
      <button type="button" className="ib-tpl" onClick={() => onPick(item)}>
        <span className="ib-tpl-top">
          <b>{item.title}</b>
          <em className={item.shared ? 'ib-tag brand' : 'ib-tag'}>
            <Icon name={item.shared ? 'team' : 'lock'} size={12} />
            {item.shared ? (item.mine ? 'Equipo · tuya' : `Equipo · ${item.author}`) : 'Privada'}
          </em>
        </span>
        <span className="ib-tpl-body">{item.body}</span>
        {hint && <small className="ib-help">{hint}</small>}
      </button>
    </MotionSupport.motion.li>
  );
}

/**
 * Las respuestas en dos grupos: las privadas y las del equipo. Sirve igual para elegir una (en la conversación)
 * que para administrarlas (`hintFor` agrega una nota por texto, ej. quién puede editarlo).
 */
export function TemplateList({
  items,
  onPick,
  hintFor,
  empty,
}: {
  items: ReplyTemplate[];
  onPick: (item: ReplyTemplate) => void;
  hintFor?: (item: ReplyTemplate) => string | undefined;
  empty: string;
}) {
  const priv = items.filter((item) => !item.shared);
  const team = items.filter((item) => item.shared);
  if (items.length === 0) return <p className="ib-closed">{empty}</p>;

  return (
    <div className="ib-tpl-groups">
      {priv.length > 0 && (
        <section>
          <h3 className="ib-avail-title">Privadas</h3>
          <ul className="ib-tpl-list">
            {priv.map((item, index) => (
              <Card key={item.id} item={item} index={index} onPick={onPick} hint={hintFor?.(item)} />
            ))}
          </ul>
        </section>
      )}
      {team.length > 0 && (
        <section>
          <h3 className="ib-avail-title">Del equipo</h3>
          <ul className="ib-tpl-list">
            {team.map((item, index) => (
              <Card key={item.id} item={item} index={index} onPick={onPick} hint={hintFor?.(item)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
