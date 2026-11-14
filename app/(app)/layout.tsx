'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BottomNav, Hud, HudSkeleton } from '@/components/shell';
import { useMe } from '@/lib/client/api';

/** Client-side auth gate: no session -> /login. Floating HUD + bottom nav on every page. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: me, error } = useMe();
  const unauthenticated = (error as { code?: string } | undefined)?.code === 'UNAUTHENTICATED';

  useEffect(() => {
    if (unauthenticated) router.replace('/login');
  }, [unauthenticated, router]);

  if (unauthenticated) return null;
  return (
    <div className="relative min-h-screen">
      <div className="fixed left-3 top-3 z-30">{me ? <Hud data={me} /> : <HudSkeleton />}</div>
      <main>{children}</main>
      <BottomNav />
    </div>
  );
}
