import { checkinSchema } from '@/lib/contracts';
import { handle, ok, readJson } from '@/lib/server/http';
import { requireUser } from '@/lib/server/session';
import { checkInQuest } from '@/lib/server/services';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  return handle(async () => {
    const user = await requireUser();
    const { lat, lng } = checkinSchema.parse(await readJson(req));
    return ok(await checkInQuest(user, params.id, lat, lng));
  });
}
