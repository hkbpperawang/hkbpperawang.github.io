import { ReactNode } from 'react';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type Variant = 'default' | 'be' | 'bn' | 'kj';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  interactive?: boolean;
}

export function Card({ children, className, variant = 'default', interactive = true }: CardProps) {
  const base = 'w-full p-3 md:p-3.5 border rounded-md text-left bg-white/10 border-white/20 text-white transition-all backdrop-blur';
  const interactiveCls = interactive ? 'hover:bg-white/15 cursor-pointer' : '';
  const variantCls = variant === 'be' ? 'ring-0' : variant === 'bn' ? 'ring-0' : '';
  return <div className={cn(base, interactiveCls, variantCls, className)}>{children}</div>;
}
