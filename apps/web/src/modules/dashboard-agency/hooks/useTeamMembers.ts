import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { toast } from '@/lib/toast';
import { AGENTS, MAX_AGENTS, ROLE_ADMIN, ROLE_AGENT } from './agency-data';
import { badgeStyle } from './agency-style';

const ACTIVE_COLOR = '#1F9D55';
const PENDING_COLOR = '#D98A00';
const PENDING_AVATAR_COLOR = '#6B7488';

/** Alguien invitado que todavía no aceptó. */
interface Invitation {
  email: string;
  role: string;
}

/**
 * El equipo de la inmobiliaria, compartido por escritorio y teléfono:
 * los agentes, las invitaciones pendientes, el cambio de rol y el formulario de invitar.
 */
export function useTeamMembers() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  // Roles cambiados en pantalla: id del miembro -> rol nuevo
  const [changedRoles, setChangedRoles] = useState<{ [memberId: string]: string }>({});
  const [email, setEmail] = useState('');
  const [inviteRole, setInviteRole] = useState(ROLE_AGENT);

  // Agentes + invitaciones pendientes, con la misma forma para dibujarlos igual
  const people = [
    ...AGENTS.map((agent) => ({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      role: agent.role,
      color: agent.color,
      properties: agent.propertyCount,
      leads: agent.activeLeads,
      statusLabel: agent.name.endsWith('a') ? 'Activa' : 'Activo',
      statusStyle: badgeStyle(ACTIVE_COLOR),
      subtitle: `${agent.propertyCount} propiedades · ${agent.activeLeads} leads`,
    })),
    ...invitations.map((invitation, index) => ({
      id: `invitation-${index}`,
      name: invitation.email.split('@')[0],
      email: invitation.email,
      role: invitation.role,
      color: PENDING_AVATAR_COLOR,
      properties: 0,
      leads: 0,
      statusLabel: 'Invitación pendiente',
      statusStyle: badgeStyle(PENDING_COLOR),
      subtitle: 'Invitación pendiente',
    })),
  ];

  const members = people.map((person) => {
    const role = changedRoles[person.id] ?? person.role;
    return {
      ...person,
      role,
      initials: person.name.slice(0, 2).toUpperCase(),
      changeRole: () =>
        setChangedRoles({
          ...changedRoles,
          [person.id]: role === ROLE_AGENT ? ROLE_ADMIN : ROLE_AGENT,
        }),
    };
  });

  const seatsUsed = members.length;

  function sendInvitation() {
    if (seatsUsed >= MAX_AGENTS) {
      toast('Tu plan llegó al límite de agentes', 'warn');
      return;
    }
    if (email.indexOf('@') < 1) {
      toast('Escribe un correo válido', 'warn');
      return;
    }
    setInvitations([...invitations, { email, role: inviteRole }]);
    setEmail('');
    toast(`Invitación enviada a ${email}`);
  }

  return {
    members,

    // Cuántos lugares del plan se usan
    seatsUsed,
    seatsPercent: `${Math.min(100, (seatsUsed / MAX_AGENTS) * 100)}%`,

    // Formulario de invitar
    email,
    onEmailChange: (event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value),
    agentButtonClass: inviteRole === ROLE_AGENT ? 'seg on' : 'seg',
    adminButtonClass: inviteRole === ROLE_ADMIN ? 'seg on' : 'seg',
    chooseAgent: () => setInviteRole(ROLE_AGENT),
    chooseAdmin: () => setInviteRole(ROLE_ADMIN),
    sendInvitation,
  };
}
