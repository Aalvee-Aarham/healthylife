import React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'peach' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'hl-btn-primary',
  peach: 'hl-btn-peach',
  ghost: 'hl-btn-ghost',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'text-[11px] px-3 py-1.5',
  md: '', // default sizing comes from the hl-btn-* classes
  lg: 'text-sm px-6 py-3',
};

/** Shared button matching .hl-btn-primary / .hl-btn-peach / .hl-btn-ghost styles. */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className = '',
  children,
  ...rest
}) => {
  return (
    <button
      className={`${variantClass[variant]} ${sizeClass[size]} ${fullWidth ? 'w-full' : ''} inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      {children}
    </button>
  );
};

export default Button;
