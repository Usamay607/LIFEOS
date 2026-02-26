'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, CalendarCheck, Swords, Map, ClipboardList, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/hq', label: 'HQ', icon: Shield },
  { href: '/today', label: 'Today', icon: CalendarCheck },
  { href: '/campaigns', label: 'Campaigns', icon: Swords },
  { href: '/life-map', label: 'Map', icon: Map },
  { href: '/reviews', label: 'Reviews', icon: ClipboardList },
  { href: '/system', label: 'System', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0d0d24] border-t border-card-border">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === '/hq' && pathname === '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-2 py-1 transition-colors ${
                active ? 'text-accent-green' : 'text-muted hover:text-foreground'
              }`}
            >
              <Icon size={20} />
              <span className="text-[9px] font-medium uppercase tracking-wider">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
