import React from 'react';

type ButtonVariant = 'primary' | 'outline' | 'danger' | 'ghost' | 'danger-ghost';

interface ButtonProps {
  children?: React.ReactNode;
  title?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  icon?: React.ReactNode;
  isSelected?: boolean;
  disabled?: boolean;
  className?: string;
  variant?: ButtonVariant;
  size?: 'lg' | 'sm';
  type?: 'button' | 'submit' | 'reset';
  'aria-label'?: string;
}

export default function Button({
  children,
  title,
  onClick,
  icon,
  isSelected = false,
  disabled = false,
  className = '',
  variant = 'primary',
  size = 'lg',
  type = 'button',
  'aria-label': ariaLabel,
}: ButtonProps) {
  const variantClass = variant !== 'primary' ? ` Button--${variant}` : '';
  const base =
    size === 'sm'
      ? `AdminBtn AdminBtn--${variant}`
      : `Button${variantClass}${isSelected ? ' Button--selected' : ''}`;

  const cls = [base, className].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={cls}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {icon && <span className="Button__icon">{icon}</span>}
      {children ?? title}
    </button>
  );
}
