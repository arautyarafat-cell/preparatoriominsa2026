/**
 * Sistema de Ícones SVG - Tipagem TypeScript
 */

export const ICON_NAMES = [
    // Navegação
    'arrow-left', 'arrow-right', 'arrow-up', 'arrow-down',
    'chevron-left', 'chevron-right', 'chevron-up', 'chevron-down',
    'menu', 'x', 'external-link',
    // Ações
    'check', 'check-circle', 'plus', 'minus', 'edit', 'trash', 'copy',
    'download', 'upload', 'refresh', 'search', 'filter', 'save',
    // Utilizador
    'user', 'users', 'logout', 'login', 'settings', 'lock', 'unlock', 'shield',
    // Conteúdo
    'file', 'file-text', 'folder', 'image', 'clipboard', 'book', 'book-open',
    // Educação
    'graduation-cap', 'lightbulb', 'target', 'trophy', 'star', 'award', 'chart-bar',
    // Interface
    'home', 'grid', 'list', 'eye', 'eye-off', 'info', 'help-circle',
    'alert-circle', 'alert-triangle', 'x-circle',
    // Mídia
    'play', 'pause', 'volume', 'volume-off', 'mic',
    // Tempo
    'clock', 'calendar', 'timer',
    // Pagamento
    'credit-card', 'wallet', 'bank', 'money',
    // Comunicação
    'mail', 'phone', 'whatsapp', 'send', 'bell',
    // Médico/Saúde
    'stethoscope', 'pill', 'heartbeat', 'hospital', 'first-aid',
    // Status
    'loading', 'verified', 'blocked',
    // Misc
    'sun', 'moon', 'link', 'tag', 'map-pin', 'globe', 'zap', 'sparkles',
] as const;

export type IconName = typeof ICON_NAMES[number];

export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';

export const ICON_SIZE_CLASSES: Record<IconSize, string> = {
    xs: 'w-3 h-3', sm: 'w-4 h-4', md: 'w-5 h-5',
    lg: 'w-6 h-6', xl: 'w-8 h-8', '2xl': 'w-10 h-10', '3xl': 'w-12 h-12',
};

export interface IconProps {
    name: IconName;
    size?: IconSize | number;
    className?: string;
    color?: string;
    strokeWidth?: number;
    rotate?: number;
    animation?: 'spin' | 'pulse' | 'bounce' | 'none';
    ariaLabel?: string;
    onClick?: () => void;
    title?: string;
}
