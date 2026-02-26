'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, CalendarCheck, Swords, Map, ClipboardList, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/hq', label: 'HQ', icon: Shield },
  { href: '/today', label: 'Today', icon: CalendarCheck },
  { href: '/campaigns', label: 'Quests', icon: Swords },
  { href: '/life-map', label: 'Map', icon: Map },
  { href: '/reviews', label: 'Review', icon: ClipboardList },
  { href: '/system', label: 'System', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-t border-card-border">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href === '/hq' && pathname === '/');
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl transition-all min-w-[48px] ${
                active
                  ? 'text-primary bg-blue-50'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              <span className={`text-[9px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
