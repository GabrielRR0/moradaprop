// Genera apps/web/src/app/<ruta>/page.tsx para cada pagina del diseno.
// Cada page.tsx solo importa desde @/modules/<modulo> (regla de CONVENCIONES.md).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const appDir = path.join(root, 'apps/web/src/app');

const ROUTES = [
  ['', 'home', 'HomePage', null],
  ['mapa', 'map', 'MapPage', 'Mapa'],
  ['filtros', 'map', 'FiltersPage', 'Filtros'],
  ['registro', 'auth', 'RegisterPage', 'Crear cuenta'],
  ['publicar', 'publish', 'PublishPage', 'Publicar propiedad'],
  ['panel', 'dashboard-agency', 'DashboardPage', 'Panel'],
  ['panel/propiedades', 'dashboard-agency', 'InventoryPage', 'Propiedades'],
  ['panel/importar', 'dashboard-agency', 'ImportPage', 'Importar desde Excel'],
  ['panel/leads', 'dashboard-agency', 'LeadsPage', 'Leads y citas'],
  ['panel/equipo', 'dashboard-agency', 'TeamPage', 'Equipo'],
  ['propiedad/[id]', 'properties', 'PropertyPage', 'Propiedad'],
  ['admin', 'admin', 'AdminPage', 'Administración'],
  ['diseno', 'design', 'DesignKitPage', 'Kit de diseño'],
];

for (const [route, mod, page, title] of ROUTES) {
  const metadata = title ? `\nexport const metadata: Metadata = { title: '${title}' };\n` : '';
  const code = `${title ? "import type { Metadata } from 'next';\n" : ''}import { ${page} } from '@/modules/${mod}';
${metadata}
export default function Page() {
  return <${page} />;
}
`;
  const file = path.join(appDir, route, 'page.tsx');
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, code);
}
console.log(`${ROUTES.length} rutas generadas`);
