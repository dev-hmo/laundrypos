// ============================================================
// Laundry OMS — POS Checkout Page
// ============================================================

'use client';

import { ServiceSelector } from '@/components/pos/ServiceSelector';
import { CartPanel } from '@/components/pos/CartPanel';
import { CustomerSearch } from '@/components/pos/CustomerSearch';

export default function POSPage() {
  return (
    <div className="flex gap-6 h-[calc(100vh-7rem)] pos-layout">
      {/* Left: Services + Customer */}
      <div className="flex-1 overflow-y-auto space-y-6 pr-2">
        <CustomerSearch />
        <ServiceSelector />
      </div>

      {/* Right: Cart */}
      <div className="w-[380px] xl:w-[420px] shrink-0 bg-white rounded-xl border border-slate-200 p-5 
                      shadow-sm flex flex-col overflow-hidden pos-cart">
        <CartPanel />
      </div>
    </div>
  );
}
