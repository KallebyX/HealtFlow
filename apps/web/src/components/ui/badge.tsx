import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground',
        success:
          'border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        warning:
          'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        info:
          'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        // Appointment statuses
        scheduled:
          'border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
        confirmed:
          'border-transparent bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
        inProgress:
          'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
        completed:
          'border-transparent bg-gray-100 text-gray-800 dark:bg-gray-800/50 dark:text-gray-300',
        cancelled:
          'border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
        noShow:
          'border-transparent bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        // Triage levels
        triageEmergency:
          'border-transparent bg-red-500 text-white',
        triageUrgent:
          'border-transparent bg-orange-500 text-white',
        triagePriority:
          'border-transparent bg-yellow-500 text-black',
        triageStandard:
          'border-transparent bg-green-500 text-white',
        triageNonUrgent:
          'border-transparent bg-blue-500 text-white',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
