"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function ModuleSwitcher() {
  const pathname = usePathname();
  const rto = pathname.startsWith('/rent-to-own');
  const shared = pathname.startsWith('/bank-finance');
  return <nav aria-label="Business systems" className="flex shrink-0 rounded-xl border border-border bg-card p-1">
    {[{ href: '/', label: 'Normal Rental', active: !rto && !shared }, { href: '/rent-to-own', label: 'Rent-to-Own', active: rto }].map(item =>
      <Link key={item.href} href={item.href} aria-current={item.active ? 'true' : undefined} className={cn('rounded-lg px-3 py-2 text-xs font-semibold transition-colors', item.active ? 'bg-primary text-white' : 'text-muted hover:text-ink')}>{item.label}</Link>
    )}
  </nav>;
}
