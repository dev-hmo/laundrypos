// ============================================================
// Laundry OMS — Service Selector Grid (POS)
// ============================================================

'use client';

import { SERVICE_CATALOG, type ServiceOption } from '@/types';
import { useCartStore } from '@/stores/useCartStore';

export function ServiceSelector() {
  const addItem = useCartStore((s) => s.addItem);

  return (
    <div>
      <h2 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-4">
        Services
      </h2>
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 service-grid">
        {SERVICE_CATALOG.map((service) => (
          <ServiceCard
            key={service.id}
            service={service}
            onSelect={() => addItem(service)}
          />
        ))}
      </div>
    </div>
  );
}

function ServiceCard({
  service,
  onSelect,
}: {
  service: ServiceOption;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
      id={`service-${service.id}`}
      className="card p-4 text-left cursor-pointer hover:border-[var(--color-accent)] 
                 active:scale-[0.98] transition-all duration-150 group w-full"
      aria-label={`Add ${service.name} — $${service.unitPrice.toFixed(2)} per ${service.unit}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl" role="img" aria-hidden="true">
          {service.icon}
        </span>
        <span className="text-xs font-medium text-[var(--color-text-muted)] 
                         bg-slate-100 px-2 py-0.5 rounded-full group-hover:bg-[var(--color-accent-light)]
                         group-hover:text-[var(--color-accent)] transition-colors"
              aria-hidden="true">
          +Add
        </span>
      </div>
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-0.5">
        {service.name}
      </h3>
      <p className="text-xs text-[var(--color-text-muted)] mb-2 leading-relaxed">
        {service.description}
      </p>
      <div className="text-sm font-bold text-[var(--color-accent)]">
        ${service.unitPrice.toFixed(2)}
        <span className="text-xs font-normal text-[var(--color-text-muted)]">
          /{service.unit}
        </span>
      </div>
    </button>
  );
}
