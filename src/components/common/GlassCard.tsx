import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassCard({ children, className, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-xl',
        'hover:bg-white/15 transition-all duration-300',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}
