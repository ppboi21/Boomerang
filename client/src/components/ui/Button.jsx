import { LoaderCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { forwardRef } from 'react';
import { Link } from 'react-router';
import { usePrefs } from '../../context/PrefsContext';

const VARIANTS = {
  primary: 'bg-zap text-night hover:bg-zap-hi shadow-[0_10px_30px_-12px_rgba(200,255,46,0.6)]',
  lost: 'bg-grape text-night hover:brightness-110 shadow-[0_10px_30px_-12px_rgba(169,139,255,0.6)]',
  secondary: 'border border-ink-700 bg-ink-800 text-ink-50 hover:border-ink-600 hover:bg-ink-700',
  ghost: 'text-ink-200 hover:bg-ink-800 hover:text-ink-50',
  danger: 'border border-coral/30 bg-coral/10 text-coral-fg hover:bg-coral/20',
};
const SIZES = {
  sm: 'h-9 gap-1.5 rounded-lg px-3 text-sm',
  md: 'h-11 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-13 gap-2.5 rounded-2xl px-6 text-[15px]',
  icon: 'size-10 rounded-xl',
};

export const buttonClass = (variant = 'primary', size = 'md', extra = '') =>
  `inline-flex shrink-0 select-none items-center justify-center font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ${VARIANTS[variant]} ${SIZES[size]} ${extra}`;

export const Button = forwardRef(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className = '', sound = 'click', onClick, children, type = 'button', ...props },
  ref,
) {
  const { play } = usePrefs();
  return (
    <motion.button
      ref={ref}
      type={type}
      whileTap={{ scale: 0.96 }}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      onClick={(e) => {
        if (sound) play(sound);
        onClick?.(e);
      }}
      className={buttonClass(variant, size, className)}
      {...props}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {children}
    </motion.button>
  );
});

export function ButtonLink({ to, variant = 'primary', size = 'md', className = '', children, ...props }) {
  const { play } = usePrefs();
  return (
    <Link to={to} onClick={() => play('click')} className={buttonClass(variant, size, `active:scale-[0.97] ${className}`)} {...props}>
      {children}
    </Link>
  );
}
