'use client';

import '../ui/cozy.css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Map as MapIcon, ScrollText, Store, User, Users, type LucideIcon } from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** SYSTEM.md §9 order: Map · Quests · People · Store · Profile */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Map', icon: MapIcon },
  { href: '/quests', label: 'Quests', icon: ScrollText },
  { href: '/activities', label: 'Activities', icon: CalendarDays },
  { href: '/people', label: 'People', icon: Users },
  { href: '/store', label: 'Store', icon: Store },
  { href: '/profile', label: 'Profile', icon: User },
];

function isActive(href: string, path: string) {
  if (href === '/') return path === '/';
  return path === href || path.startsWith(`${href}/`);
}

/**
 * Floating pill nav. Height is ~72px + 12px bottom gap: give pages `padding-bottom: 96px`
 * (or use <Sheet bottomOffset={88} />). `activePath` is only for the dev gallery.
 */
export function BottomNav({ items = NAV_ITEMS, activePath }: { items?: NavItem[]; activePath?: string }) {
  const pathname = usePathname();
  const path = activePath ?? pathname ?? '/';
  return (
    <nav className="cz-nav cz-glass" aria-label="Main">
      {items.map(({ href, label, icon: Icon }) => {
        const active = isActive(href, path);
        return (
          <Link key={href} href={href} className="cz-nav__item" aria-current={active ? 'page' : undefined}>
            <Icon size={22} strokeWidth={2.4} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export default BottomNav;
