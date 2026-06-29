// ============================================================
// Laundry OMS — Home Page (redirect to POS)
// ============================================================

import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/pos');
}
