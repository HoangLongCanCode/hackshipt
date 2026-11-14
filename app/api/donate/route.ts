import { donateSchema } from '@/lib/contracts';
import { handle, ok, readJson } from '@/lib/server/http';
import { requireUser } from '@/lib/server/session';
import { donateCredits } from '@/lib/server/services';

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    return ok(await donateCredits(user, donateSchema.parse(await readJson(req))));
  });
}
