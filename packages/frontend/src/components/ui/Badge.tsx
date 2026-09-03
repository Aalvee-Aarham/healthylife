import React from 'react';

type BadgeVariant = 'green' | 'peach' | 'teal' | 'amber';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

/** Thin wrapper around .hl-badge + color variant classes. */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'green',
  className = '',
  children,
  ...rest
}) => {
  return (
    <span className={`hl-badge hl-badge-${variant} ${className}`} {...rest}>
      {children}
    </span>
  );
};

export default Badge;
