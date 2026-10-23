// Catalogo de pantallas del diseno: archivo -> componente, modulo y como se ajusta al tamano real.
// fit: 'app' = ocupa la ventana (100dvh); 'auto' = altura segun contenido; sin fit = ya es fluida.

export const ROUTES = {
  Main: '/',
  Mapa: '/mapa',
  Movil: '/mapa',
  Filtros: '/filtros',
  Registro: '/registro',
  MRegistro: '/registro',
  Publicar: '/publicar',
  MPublicar: '/publicar',
  Panel: '/panel',
  MPanel: '/panel',
  Inventario: '/panel/propiedades',
  MInventario: '/panel/propiedades',
  Importar: '/panel/importar',
  MImportar: '/panel/importar',
  Leads: '/panel/leads',
  MLeads: '/panel/leads',
  Equipo: '/panel/equipo',
  MEquipo: '/panel/equipo',
  Ficha: '/propiedad/ejemplo',
  MFicha: '/propiedad/ejemplo',
  Admin: '/admin',
  Kit: '/diseno',
};

// Botones de la ficha que en la maqueta eran estaticos: ahora disparan avisos.
const PROPERTY_ACTIONS = [
  [/Solicitar visita/, 'onClick={v.requestVisit}'],
  [/Apartar esta propiedad/, 'onClick={v.reserve}'],
];

export const SCREENS = [
  { file: 'Main', comp: 'HomeScreen', module: 'home', reveal: true },
  { file: 'Mapa', handEdited: true, comp: 'MapScreen', module: 'map', fit: 'app' },
  { file: 'Movil', handEdited: true, comp: 'MapMobileScreen', module: 'map', fit: 'app', mobile: true },
  { file: 'Filtros', handEdited: true, comp: 'FiltersScreen', module: 'map', fit: 'app', maxWidth: 560 },
  { file: 'Registro', comp: 'RegisterScreen', module: 'auth', fit: 'app' },
  { file: 'MRegistro', comp: 'RegisterMobileScreen', module: 'auth', fit: 'app', mobile: true },
  { file: 'Publicar', comp: 'PublishScreen', module: 'publish', fit: 'app' },
  { file: 'MPublicar', comp: 'PublishMobileScreen', module: 'publish', fit: 'app', mobile: true },
  { file: 'Panel', comp: 'DashboardScreen', module: 'dashboard-agency', fit: 'app' },
  {
    file: 'MPanel',
    comp: 'DashboardMobileScreen',
    module: 'dashboard-agency',
    fit: 'app',
    mobile: true,
  },
  { file: 'Inventario', comp: 'InventoryScreen', module: 'dashboard-agency', fit: 'app' },
  {
    file: 'MInventario',
    comp: 'InventoryMobileScreen',
    module: 'dashboard-agency',
    fit: 'app',
    mobile: true,
  },
  { file: 'Importar', comp: 'ImportScreen', module: 'dashboard-agency', fit: 'app' },
  {
    file: 'MImportar',
    comp: 'ImportMobileScreen',
    module: 'dashboard-agency',
    fit: 'app',
    mobile: true,
  },
  { file: 'Leads', comp: 'LeadsScreen', module: 'dashboard-agency', fit: 'app' },
  {
    file: 'MLeads',
    comp: 'LeadsMobileScreen',
    module: 'dashboard-agency',
    fit: 'app',
    mobile: true,
  },
  { file: 'Equipo', comp: 'TeamScreen', module: 'dashboard-agency', fit: 'app' },
  {
    file: 'MEquipo',
    comp: 'TeamMobileScreen',
    module: 'dashboard-agency',
    fit: 'app',
    mobile: true,
  },
  {
    file: 'Ficha',
    comp: 'PropertyScreen',
    module: 'properties',
    reveal: true,
    textInject: PROPERTY_ACTIONS,
  },
  {
    file: 'MFicha',
    comp: 'PropertyMobileScreen',
    module: 'properties',
    fit: 'app',
    mobile: true,
    textInject: PROPERTY_ACTIONS,
  },
  { file: 'Admin', comp: 'AdminScreen', module: 'admin', fit: 'app' },
  { file: 'Kit', comp: 'DesignKitScreen', module: 'design', fit: 'auto' },
];

export const PAGES = [
  { module: 'home', name: 'HomePage', desktop: 'Main' },
  { module: 'map', name: 'MapPage', desktop: 'Mapa', mobile: 'Movil', handEdited: true },
  { module: 'map', name: 'FiltersPage', desktop: 'Filtros', handEdited: true },
  { module: 'auth', name: 'RegisterPage', desktop: 'Registro', mobile: 'MRegistro' },
  { module: 'publish', name: 'PublishPage', desktop: 'Publicar', mobile: 'MPublicar' },
  { module: 'dashboard-agency', name: 'DashboardPage', desktop: 'Panel', mobile: 'MPanel' },
  {
    module: 'dashboard-agency',
    name: 'InventoryPage',
    desktop: 'Inventario',
    mobile: 'MInventario',
  },
  { module: 'dashboard-agency', name: 'ImportPage', desktop: 'Importar', mobile: 'MImportar' },
  { module: 'dashboard-agency', name: 'LeadsPage', desktop: 'Leads', mobile: 'MLeads' },
  { module: 'dashboard-agency', name: 'TeamPage', desktop: 'Equipo', mobile: 'MEquipo' },
  { module: 'properties', name: 'PropertyPage', desktop: 'Ficha', mobile: 'MFicha' },
  { module: 'admin', name: 'AdminPage', desktop: 'Admin', mobileNotice: true },
  { module: 'design', name: 'DesignKitPage', desktop: 'Kit' },
];

export const MODULES = {
  home: 'Página de inicio pública: buscador grande, filtros rápidos, servicios clave de Venezuela (planta eléctrica, agua, fibra, vigilancia), propiedades cerca de ti, cómo funciona y llamado a publicar.',
  map: 'Búsqueda en mapa: mapa con pines y grupos (clustering), lista lateral, ficha flotante, barra de filtros y el panel de filtros avanzados. Móvil con hoja inferior deslizable.',
  auth: 'Registro de cuenta en 3 pasos (perfil: cliente / dueño / inmobiliaria, datos, código de 6 dígitos) y pantalla de éxito. El mensaje lateral cambia según el perfil.',
  publish:
    'Formulario guiado para publicar una propiedad en 6 pasos (tipo, ubicación con pin, detalles, servicios, fotos, precio) con vista previa en vivo y medidor de calidad del anuncio.',
  'dashboard-agency':
    'Panel de inmobiliarias: resumen, inventario de propiedades (tabla/tarjetas, selección múltiple, cambio de estado), importación desde Excel, tablero de leads y citas, y equipo con roles. Cada pantalla tiene su versión móvil con barra inferior.',
  properties:
    'Ficha de propiedad para el cliente: galería, datos, servicios, mapa de zona aproximada, agente, WhatsApp, agenda de visitas y propiedades parecidas.',
  admin:
    'Moderación de anuncios para el administrador: cola de revisión, revisión automática, aprobar / pedir cambios / rechazar y auditoría reciente. Solo escritorio (en el teléfono muestra un aviso).',
  design:
    'Kit de diseño (/diseno): paleta de acentos, estados de pines, insignias y animaciones. Sirve de referencia visual.',
};
