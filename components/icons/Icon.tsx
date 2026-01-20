import React from 'react';
import { IconName, IconSize, IconProps, ICON_SIZE_CLASSES } from './icons.types';

/**
 * Componente Icon Profissional
 * 
 * Usa SVG symbols via <use href> para máxima performance e reutilização.
 * Os símbolos são definidos no IconSprite.tsx que deve ser renderizado uma vez no root.
 * 
 * @example
 * // Uso básico
 * <Icon name="check" />
 * 
 * // Com tamanho
 * <Icon name="home" size="lg" />
 * 
 * // Com cor e classe
 * <Icon name="star" className="text-yellow-500" />
 * 
 * // Com animação
 * <Icon name="loading" animation="spin" />
 */
const Icon: React.FC<IconProps> = ({
    name,
    size = 'md',
    className = '',
    color,
    strokeWidth,
    rotate = 0,
    animation = 'none',
    ariaLabel,
    onClick,
    title,
}) => {
    // Determinar classe de tamanho
    const sizeClass = typeof size === 'string'
        ? ICON_SIZE_CLASSES[size]
        : '';

    // Estilo inline para tamanho numérico
    const sizeStyle = typeof size === 'number'
        ? { width: size, height: size }
        : {};

    // Classes de animação
    const animationClasses: Record<string, string> = {
        spin: 'animate-spin',
        pulse: 'animate-pulse',
        bounce: 'animate-bounce',
        none: '',
    };

    // Construir classes finais
    const classes = [
        sizeClass,
        animationClasses[animation],
        onClick ? 'cursor-pointer' : '',
        className,
    ].filter(Boolean).join(' ');

    // Estilo combinado
    const style: React.CSSProperties = {
        ...sizeStyle,
        color: color,
        transform: rotate !== 0 ? `rotate(${rotate}deg)` : undefined,
        transition: 'transform 0.2s ease, color 0.2s ease',
    };

    return (
        <svg
            className={classes}
            style={style}
            aria-label={ariaLabel}
            aria-hidden={!ariaLabel}
            role={ariaLabel ? 'img' : 'presentation'}
            onClick={onClick}
            xmlns="http://www.w3.org/2000/svg"
            {...(strokeWidth && { strokeWidth })}
        >
            {title && <title>{title}</title>}
            <use href={`#icon-${name}`} />
        </svg>
    );
};

// Componente wrapper para ícones com círculo de fundo
interface IconCircleProps extends IconProps {
    bgClassName?: string;
    circleSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export const IconCircle: React.FC<IconCircleProps> = ({
    bgClassName = 'bg-slate-100',
    circleSize = 'md',
    ...iconProps
}) => {
    const circleSizes = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-14 h-14',
    };

    return (
        <div className={`${circleSizes[circleSize]} ${bgClassName} rounded-full flex items-center justify-center`}>
            <Icon {...iconProps} />
        </div>
    );
};

// Componente para ícone com badge/contador
interface IconBadgeProps extends IconProps {
    count?: number;
    showDot?: boolean;
    badgeColor?: string;
}

export const IconBadge: React.FC<IconBadgeProps> = ({
    count,
    showDot = false,
    badgeColor = 'bg-red-500',
    ...iconProps
}) => {
    return (
        <div className="relative inline-flex">
            <Icon {...iconProps} />
            {(count !== undefined || showDot) && (
                <span
                    className={`absolute -top-1 -right-1 ${badgeColor} text-white text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1`}
                >
                    {count !== undefined ? (count > 99 ? '99+' : count) : ''}
                </span>
            )}
        </div>
    );
};

// Componente para botão com ícone
interface IconButtonProps extends IconProps {
    variant?: 'default' | 'ghost' | 'outline' | 'primary';
    disabled?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
    variant = 'default',
    disabled = false,
    onClick,
    ...iconProps
}) => {
    const variants = {
        default: 'bg-slate-100 hover:bg-slate-200 text-slate-600',
        ghost: 'hover:bg-slate-100 text-slate-500 hover:text-slate-700',
        outline: 'border border-slate-200 hover:border-slate-300 text-slate-600',
        primary: 'bg-brand-500 hover:bg-brand-600 text-white',
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`
        p-2 rounded-lg transition-all duration-200
        ${variants[variant]}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus:ring-2 focus:ring-brand-500/50
      `}
        >
            <Icon {...iconProps} />
        </button>
    );
};

export default Icon;
