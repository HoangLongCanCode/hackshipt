import { handle, ok } from '@/lib/server/http';
import { requireUser } from '@/lib/server/session';
import { abandonQuest } from '@/lib/server/services';

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  return handle(async () => ok(await abandonQuest(await requireUser(), params.id)));
}
