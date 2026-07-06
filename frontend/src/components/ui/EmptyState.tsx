import type { ReactNode, ElementType } from 'react';

interface EmptyStateProps {
  icon?: ElementType<{ size?: number }>;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-[var(--color-surface-overlay)] flex items-center justify-center mb-4 text-[var(--color-text-muted)]">
          <Icon size={24} />
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-[var(--color-text-muted)] max-w-xs">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  );
}
