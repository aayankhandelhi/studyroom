import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'text-foreground',
        success: 'border-transparent bg-[hsl(145,68%,39%)]/12 text-[hsl(145,68%,30%)]',
        warning: 'border-transparent bg-[hsl(35,79%,49%)]/14 text-[hsl(35,79%,38%)]',
        safe: 'border-[hsl(311,46%,45%)]/30 bg-[hsl(311,46%,45%)]/10 text-brand-plum',
        destructive: 'border-transparent bg-[hsl(4,64%,44%)]/12 text-[hsl(4,64%,40%)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}
export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
export { badgeVariants };
