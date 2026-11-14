import { ApiError } from '@/lib/contracts';
import { handle, ok } from '@/lib/server/http';
import { getSessionUser } from '@/lib/server/session';
import { loadQuestDetail } from '@/lib/server/mappers';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await getSessionUser();
    const d = await loadQuestDetail(params.id, user);
    if (!d) throw new ApiError('NOT_FOUND', 'Quest not found');
    return ok(d);
  });
}
