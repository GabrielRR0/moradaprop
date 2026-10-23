'use client';
import './teamscreen.css';
import { useTeamScreen } from '../../hooks/useTeamScreen';
import { TeamMain } from './TeamMain';
import { AgencySidebar } from '../shared/AgencySidebar';

export function TeamScreen() {
  const v = useTeamScreen();
  return (
    <div
      className="ds-teamscreen"
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
      <AgencySidebar active="equipo" />
      <TeamMain v={v} />
    </div>
  );
}
