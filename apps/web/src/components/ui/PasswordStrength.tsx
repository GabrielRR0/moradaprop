import { STRENGTH_LABELS, passwordStrength } from '@/lib/password';
import './ui.css';

/** Cuatro barritas y una palabra que reaccionan mientras se escribe la contrasena. */
export function PasswordStrength({ password }: { password: string }) {
  const level = passwordStrength(password);
  return (
    <div className="ui-strength" aria-live="polite">
      {[1, 2, 3, 4].map((n) => (
        <i key={n} className={level >= n ? 'on' : undefined} />
      ))}
      <b>{password ? STRENGTH_LABELS[level] : ''}</b>
    </div>
  );
}
