// Mejoras sobre la logica del diseno: avisos (toasts), navegacion y acciones que en la maqueta
// eran estaticas. Se aplican al regenerar, asi `convert.mjs` siempre produce el mismo resultado.
// Cada parche es [texto_original, texto_nuevo]; el texto original es el de la logica ya convertida.

const toastFav = (expr) =>
  `{ setState(${expr}); toast(__FAV__ ? 'Quitada de favoritos' : 'Guardada en favoritos'); }`;

const SAME_LEAD = (step) =>
  `move: () => { setState({ at: { ...s.at, [l.id]: Math.min(4, ${step} + 1) } }); toast('Lead avanzado a la siguiente etapa'); }`;

const cycleEstado = `cycle: () => {
          const next = order[(order.indexOf(p.st) + 1) % order.length];
          setState({ st: { ...s.st, [p.id]: next } });
          toast('Estado cambiado a ' + next);
        }`;

const inviteTeam = `if (s.email.indexOf('@') > 0 && used < 5) {
        setState({ extra: [...s.extra, { email: s.email, role: s.role }], email: '' });
        toast('Invitación enviada a ' + s.email);
      } else if (used >= 5) toast('Tu plan llegó al límite de agentes', 'warn');
      else toast('Escribe un correo válido', 'warn');`;

export const hookPatches = {
  useHomeScreen: [
    [
      'toggleFav: () => setState({ favs: { ...favs, [p.id]: !favs[p.id] } })',
      `toggleFav: () => ${toastFav('{ favs: { ...favs, [p.id]: !favs[p.id] } }').replace('__FAV__', 'favs[p.id]')}`,
    ],
  ],
  usePropertyScreen: [
    [
      'toggleFav: () => setState({ fav: !s.fav })',
      `requestVisit: () => toast('Solicitud de visita enviada. El agente te confirmará.'),
    reserve: () => toast('Propiedad apartada. El agente te contactará para confirmar.'),
    toggleFav: () => ${toastFav('{ fav: !s.fav }').replace('__FAV__', 's.fav')}`,
    ],
  ],
  usePropertyMobileScreen: [
    [
      'toggleFav: () => setState({ fav: !s.fav })',
      `requestVisit: () => toast('Solicitud de visita enviada. El agente te confirmará.'),
    toggleFav: () => ${toastFav('{ fav: !s.fav }').replace('__FAV__', 's.fav')}`,
    ],
  ],
  useInventoryScreen: [
    [
      'cycle: () => setState({ st: { ...s.st, [p.id]: order[(order.indexOf(p.st) + 1) % order.length] } })',
      cycleEstado,
    ],
  ],
  useInventoryMobileScreen: [
    [
      'cycle: () => setState({ st: { ...s.st, [p.id]: order[(order.indexOf(p.st) + 1) % order.length] } })',
      cycleEstado,
    ],
  ],
  useTeamScreen: [
    [
      "if (s.email.indexOf('@') > 0 && used < 5) setState({ extra: [...s.extra, { email: s.email, role: s.role }], email: '' });",
      inviteTeam,
    ],
  ],
  useTeamMobileScreen: [
    [
      "if (s.email.indexOf('@') > 0 && used < 5) setState({ extra: [...s.extra, { email: s.email, role: s.role }], email: '' });",
      inviteTeam,
    ],
  ],
  useLeadsScreen: [
    ['move: () => setState({ at: { ...s.at, [l.id]: Math.min(4, si + 1) } })', SAME_LEAD('si')],
  ],
  useLeadsMobileScreen: [
    [
      'move: () => setState({ at: { ...s.at, [l.id]: Math.min(4, s.tab + 1) } })',
      SAME_LEAD('s.tab'),
    ],
  ],
  useAdminScreen: [
    [
      'if (found) {',
      "if (found) {\n toast(word + ': ' + found.title, word === 'Rechazado' ? 'warn' : 'ok');",
    ],
  ],
  useImportScreen: [
    [
      'next: () => setState({ step: Math.min(4, st + 1) })',
      "next: () => { setState({ step: Math.min(4, st + 1) }); if (st === 3) toast('¡Importación lista!'); }",
    ],
  ],
  useImportMobileScreen: [
    [
      'next: () => setState({ step: Math.min(4, st + 1) })',
      "next: () => { setState({ step: Math.min(4, st + 1) }); if (st === 3) toast('¡Importación lista!'); }",
    ],
  ],
  useRegisterScreen: [
    [
      'next: () => setState({ step: Math.min(4, s.step + 1) })',
      "next: () => { setState({ step: Math.min(4, s.step + 1) }); if (s.step === 3) toast('Cuenta verificada'); }",
    ],
  ],
  useRegisterMobileScreen: [
    [
      'next: () => setState({ step: Math.min(4, s.step + 1) })',
      "next: () => { setState({ step: Math.min(4, s.step + 1) }); if (s.step === 3) toast('Cuenta verificada'); }",
    ],
  ],
};

const publish = [
  [
    'next: () => setState({ step: Math.min(6, s.step + 1) })',
    `next: () => {
      if (s.step === 6) {
        toast('¡Propiedad enviada a revisión!');
        setTimeout(() => router.push('/panel/propiedades'), 900);
        return;
      }
      setState({ step: s.step + 1 });
    }`,
  ],
];
hookPatches.usePublishScreen = publish;
hookPatches.usePublishMobileScreen = publish;

/** Hooks que necesitan el router de Next. */
export const needsRouter = new Set(['usePublishScreen', 'usePublishMobileScreen']);

export function applyHookPatches(hookName, body) {
  let out = body;
  for (const [from, to] of hookPatches[hookName] ?? []) {
    if (!out.includes(from))
      throw new Error(`Parche sin efecto en ${hookName}: ${from.slice(0, 60)}`);
    out = out.replace(from, () => to);
  }
  return out;
}
