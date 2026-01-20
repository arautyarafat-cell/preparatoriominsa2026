/**
 * Sistema de Ícones SVG Inline Profissional
 * 
 * Este módulo exporta todos os componentes e tipos necessários para usar
 * o sistema de ícones SVG inline em toda a aplicação.
 * 
 * @example
 * // Importação dos componentes
 * import { Icon, IconCircle, IconButton, IconSprite } from './components/icons';
 * 
 * // No root da aplicação (App.tsx), adicionar o IconSprite:
 * <IconSprite />
 * 
 * // Usar ícones em qualquer lugar:
 * <Icon name="check" size="lg" className="text-green-500" />
 */

// Componentes principais
export { default as Icon, IconCircle, IconBadge, IconButton } from './Icon';
export { default as IconSprite } from './IconSprite';

// Tipos
export type { IconName, IconSize, IconProps } from './icons.types';
export { ICON_NAMES, ICON_SIZE_CLASSES } from './icons.types';
