import { handle, ok } from '@/lib/server/http';
import { requireUser } from '@/lib/server/session';
import { acceptQuest } from '@/lib/server/services';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => ok(await acceptQuest(await requireUser(), params.id)));
}
