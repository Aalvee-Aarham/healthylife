import React from 'react';

type CardVariant = 'default' | 'alt';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  hover?: boolean;
  padding?: string;
}

/** Thin wrapper around the .hl-card / .hl-card-alt / .hl-card-hover utility classes. */
export const Card: React.FC<CardProps> = ({
  variant = 'default',
  hover = false,
  padding = 'p-5',
  className = '',
  children,
  ...rest
}) => {
  const base = variant === 'alt' ? 'hl-card-alt' : 'hl-card';
  return (
    <div
      className={`${base} ${hover ? 'hl-card-hover' : ''} ${padding} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
