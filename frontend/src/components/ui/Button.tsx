import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', fullWidth = false, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          'font-medium transition-all duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
          {
            // Variants
            'bg-sage-400 text-white hover:bg-sage-500 active:bg-sage-600 shadow-sm': variant === 'primary',
            'border border-sage-400 text-sage-600 hover:bg-sage-50 active:bg-sage-100': variant === 'secondary',
            'text-sage-600 hover:bg-sage-50 active:bg-sage-100': variant === 'ghost',
            // Sizes - Mobile optimized with minimum 44px touch targets
            'px-4 py-2.5 text-sm rounded-lg min-h-[44px]': size === 'sm',
            'px-6 py-3 rounded-lg min-h-[48px]': size === 'md',
            'px-8 py-4 text-lg rounded-xl min-h-[56px]': size === 'lg',
            // Full width
            'w-full': fullWidth,
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';