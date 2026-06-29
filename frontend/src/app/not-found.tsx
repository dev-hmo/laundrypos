import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
        <span className="text-3xl font-bold text-slate-400">?</span>
      </div>
      <h1 className="text-xl font-bold text-slate-900 mb-2">Page not found</h1>
      <p className="text-sm text-slate-500 mb-6">
        The page you are looking for does not exist.
      </p>
      <Link href="/pos" className="btn-primary no-underline">
        Back to POS
      </Link>
    </div>
  );
}
