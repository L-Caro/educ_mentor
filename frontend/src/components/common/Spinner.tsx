interface SpinnerProps {
  size?: 'lg' | 'sm' | 'xs';
}

export default function Spinner({ size = 'lg' }: SpinnerProps) {
  const classname = ['Spinner', size !== 'lg' ? `Spinner--${size}` : ''].filter(Boolean).join(' ');
  return <span className={classname} role="status" aria-label="Chargement" />;
}
