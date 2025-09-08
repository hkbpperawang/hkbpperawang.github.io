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

  const subtle = 'rounded-md bg-white/10 hover:bg-white/20 text-white';
  const outline = 'rounded-md border border-white/20 text-white hover:bg-white/10';

  const variantCls = variant === 'outline' ? outline : subtle;

  return (
    <Link href={href} aria-label={ariaLabel} className={cn(base, sizeCls, variantCls, className)}>
      {children}
    </Link>
  );
}
