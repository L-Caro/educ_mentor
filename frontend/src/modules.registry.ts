export const MODULE_REGISTRY = [
  { id: 'imagier', label: 'Imagier', icon: '🇬🇧', adminPath: '/admin/imagier' },
  { id: 'tables', label: 'Tables', icon: '✖️', adminPath: '/admin/tables' },
  { id: 'calcul-mental', label: 'Calcul Mental', icon: '🧮', adminPath: '/admin/calcul-mental' },
  { id: 'monnaie', label: 'Monnaie', icon: '💶', adminPath: '/admin/monnaie' },
] as const;

export type ModuleId = (typeof MODULE_REGISTRY)[number]['id'];
