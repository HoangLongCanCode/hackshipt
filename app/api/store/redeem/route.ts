import { redeemSchema } from '@/lib/contracts';
import { handle, ok, readJson } from '@/lib/server/http';
import { requireUser } from '@/lib/server/session';
import { redeemOffer } from '@/lib/server/services';

export async function POST(req: Request) {
  return handle(async () => {
    const user = await requireUser();
    const { offerId } = redeemSchema.parse(await readJson(req));
    return ok(await redeemOffer(user, offerId));
  });
}
