import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'neutral';

interface BadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
}

export default function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`AdminBadge AdminBadge--${variant}`}>
      {children}
    </span>
  );
}
