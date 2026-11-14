import { completeSchema } from '@/lib/contracts';
import { handle, ok, readJson } from '@/lib/server/http';
import { requireUser } from '@/lib/server/session';
import { completeQuest } from '@/lib/server/services';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const { code } = completeSchema.parse(await readJson(req));
    return ok(await completeQuest(user, params.id, code));
  });
}
