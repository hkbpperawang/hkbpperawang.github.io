import Link from 'next/link';
import { ReactNode } from 'react';

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type Variant = 'subtle' | 'outline';

type Size = 'sm' | 'md';

interface LinkButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: Variant;
  size?: Size;
  ariaLabel?: string;
}

export function LinkButton({ href, children, className, variant = 'subtle', size = 'md', ariaLabel }: LinkButtonProps) {
  const base = 'transition-colors';
  const sizeCls = size === 'sm' ? 'text-sm px-3 py-2' : 'px-4 py-2';

  const subtle = 'rounded-md bg-slate-100 hover:bg-slate-200 text-slate-800 dark:text-slate-200 dark:bg-brand-surface dark:hover:bg-brand-hover';
  const outline = 'rounded-md border border-slate-300 text-slate-800 hover:bg-slate-100 dark:text-slate-200 dark:border-brand-border-strong dark:hover:bg-brand-hover';

  const variantCls = variant === 'outline' ? outline : subtle;

  return (
    <Link href={href} aria-label={ariaLabel} className={cn(base, sizeCls, variantCls, className)}>
      {children}
    </Link>
  );
}
