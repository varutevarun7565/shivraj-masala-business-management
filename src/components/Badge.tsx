type BadgeVariant = 'green' | 'red' | 'orange' | 'blue' | 'gray' | 'purple';

interface BadgeProps {
  text: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
}

export default function Badge({ text, variant = 'gray', size = 'md' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${size === 'sm' ? 'badge-sm' : ''}`}>
      {text}
    </span>
  );
}
