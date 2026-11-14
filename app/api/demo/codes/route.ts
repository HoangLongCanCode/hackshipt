import { handle, ok } from '@/lib/server/http';
import { ApiError } from '@/lib/contracts';
import { db } from '@/lib/server/db';
import { requireUser } from '@/lib/server/session';

export const dynamic = 'force-dynamic';

/**
 * DEMO ONLY: questId -> verify code, so the demo UI can show the check-in code on screen.
 * Hard-disabled (404) unless DEMO_MODE="true". Never enable in production: it defeats the on-site code.
 */
export async function GET() {
  return handle(async () => {
    if (process.env.DEMO_MODE !== 'true') throw new ApiError('NOT_FOUND', 'Not found');
    await requireUser();
    const rows = await db.quest.findMany({ select: { id: true, verifyCode: true } });
    return ok(Object.fromEntries(rows.map((r) => [r.id, r.verifyCode])));
  });
}
