import { ReactNode } from 'react';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type Variant = 'default' | 'be' | 'bn';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  interactive?: boolean;
}

export function Card({ children, className, variant = 'default', interactive = true }: CardProps) {
  const base = 'w-full p-3 md:p-3.5 border rounded-md text-left bg-white border-slate-200 dark:bg-brand-surface dark:border-brand-border transition-all';
  const interactiveCls = interactive ? 'hover:shadow-md cursor-pointer' : '';
  const variantCls =
    variant === 'be'
      ? 'hover:bg-blue-50 dark:hover:bg-blue-900/30'
      : variant === 'bn'
      ? 'hover:bg-green-50 dark:hover:bg-green-900/30'
      : '';
  return <div className={cn(base, interactiveCls, variantCls, className)}>{children}</div>;
}
