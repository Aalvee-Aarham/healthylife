import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const roundedMap: Record<NonNullable<SkeletonProps['rounded']>, string> = {
  sm: 'rounded-md',
  md: 'rounded-lg',
  lg: 'rounded-2xl',
  xl: 'rounded-3xl',
  full: 'rounded-full',
};

/** Basic shimmer placeholder block. Use for any single loading rectangle/circle. */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  rounded = 'md',
  className = '',
}) => {
  return (
    <div
      className={`hl-skeleton ${roundedMap[rounded]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
};

/** A block of skeleton text lines, last line shorter by default. */
export const SkeletonText: React.FC<{ lines?: number; className?: string; lastLineWidth?: string }> = ({
  lines = 3,
  className = '',
  lastLineWidth = '60%',
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="0.75rem"
          width={i === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
};

/** A circular skeleton, commonly used for avatars/icons. */
export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = '',
}) => <Skeleton width={size} height={size} rounded="full" className={className} />;

/** A card-shaped skeleton matching .hl-card proportions, with optional header/lines. */
export const SkeletonCard: React.FC<{ className?: string; lines?: number; withAvatar?: boolean }> = ({
  className = '',
  lines = 2,
  withAvatar = false,
}) => {
  return (
    <div className={`hl-card p-5 space-y-4 ${className}`}>
      {withAvatar && (
        <div className="flex items-center gap-3">
          <SkeletonAvatar size={40} />
          <div className="flex-1 space-y-2">
            <Skeleton height="0.75rem" width="40%" />
            <Skeleton height="0.625rem" width="60%" />
          </div>
        </div>
      )}
      <SkeletonText lines={lines} />
    </div>
  );
};

/** A single list/row skeleton, e.g. for chat conversation lists or client rosters. */
export const SkeletonRow: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`flex items-center gap-3 p-3 ${className}`}>
    <SkeletonAvatar size={36} />
    <div className="flex-1 space-y-2">
      <Skeleton height="0.7rem" width="45%" />
      <Skeleton height="0.6rem" width="75%" />
    </div>
  </div>
);

/** A chat-bubble shaped skeleton, alternating left/right alignment. */
export const SkeletonChatBubble: React.FC<{ align?: 'left' | 'right'; width?: string }> = ({
  align = 'left',
  width = '55%',
}) => (
  <div className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'}`}>
    <Skeleton height="2.25rem" width={width} rounded="lg" />
  </div>
);

/** A stat-tile shaped skeleton, e.g. for dashboard metric cards. */
export const SkeletonStatTile: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`hl-card p-4 space-y-3 ${className}`}>
    <Skeleton height="0.65rem" width="50%" />
    <Skeleton height="1.5rem" width="70%" />
  </div>
);

export default Skeleton;
